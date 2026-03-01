import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import {
  deleteApp,
  getApps,
  initializeApp,
} from "firebase/app";
import {
  getDatabase,
  onValue,
  ref as dbRef,
  get,
  remove,
  set,
} from "firebase/database";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const DEFAULT_CONFIG = {
  fc: {
    apiKey: "AIzaSyA1FIDLD-AKVlEz-AJiweYVdxhIP0Rnijk",
    authDomain: "opjat-2005.firebaseapp.com",
    databaseURL:
      "https://opjat-2005-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "opjat-2005",
    storageBucket: "opjat-2005.firebasestorage.app",
    messagingSenderId: "2500552965",
    appId: "1:2500552965:web:4f6664a366967a2525af6c",
  },
  email: "www.webomprakashjat@gmail.com",
};

const THEMES = {
  cream: {
    bgPrimary: "#f0f4f8",
    bgSecondary: "#e1e8ed",
    bgCard: "#ffffff",
    accent: "#2563eb",
    accentLight: "rgba(37,99,235,0.1)",
    textPrimary: "#1e293b",
    textSecondary: "#64748b",
    border: "#cbd5e1",
    success: "#10b981",
    danger: "#ef4444",
    header: "#2563eb",
  },
  gold: {
    bgPrimary: "#1a1a1a",
    bgSecondary: "#0d0d0d",
    bgCard: "#252525",
    accent: "#ffc107",
    accentLight: "rgba(255,193,7,0.18)",
    textPrimary: "#f5f5f5",
    textSecondary: "#aaa",
    border: "#333",
    success: "#10b981",
    danger: "#ef4444",
    header: "#ff9800",
  },
  cyber: {
    bgPrimary: "#0a0e1a",
    bgSecondary: "#050810",
    bgCard: "#0d1220",
    accent: "#00f5ff",
    accentLight: "rgba(0,245,255,0.15)",
    textPrimary: "#e0f7ff",
    textSecondary: "#7fdbff",
    border: "#1a3a4a",
    success: "#10b981",
    danger: "#ef4444",
    header: "#0080ff",
  },
  firebase: {
    bgPrimary: "#2D1B0E",
    bgSecondary: "#3D2815",
    bgCard: "#4A3520",
    accent: "#FF9800",
    accentLight: "rgba(255,152,0,0.25)",
    textPrimary: "#FFF3E0",
    textSecondary: "#FFCC80",
    border: "#FF6D00",
    success: "#FFB300",
    danger: "#FF5252",
    header: "#F57C00",
  },
};

const formatDate = (date) => {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const parseDate = (value) => {
  if (!value) return null;
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  const [dd, mm, yy] = parts;
  return new Date(Number(yy), Number(mm) - 1, Number(dd));
};

const isExpired = (dateValue) => {
  const parsed = parseDate(dateValue);
  if (!parsed) return false;
  const now = new Date();
  return parsed < new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const createStyles = (theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.bgPrimary,
    },
    header: {
      backgroundColor: theme.header,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerTitle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerTitleText: {
      color: "white",
      fontSize: 16,
      fontWeight: "700",
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    userAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    userName: {
      color: "white",
      fontSize: 12,
      fontWeight: "600",
      maxWidth: 90,
    },
    userEmail: {
      color: "rgba(255,255,255,0.7)",
      fontSize: 10,
      maxWidth: 90,
    },
    logoutBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 6,
    },
    logoutBtnText: {
      color: "white",
      fontWeight: "600",
      fontSize: 11,
    },
    card: {
      backgroundColor: theme.bgCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionTitle: {
      color: theme.accent,
      fontWeight: "700",
      marginBottom: 10,
      fontSize: 12,
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    infoBox: {
      backgroundColor: theme.accentLight,
      padding: 12,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: theme.accent,
      marginBottom: 12,
    },
    infoText: {
      color: theme.textSecondary,
      fontSize: 11,
      lineHeight: 16,
    },
    primaryBtn: {
      backgroundColor: theme.accent,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    primaryBtnText: {
      color: "white",
      fontWeight: "700",
      fontSize: 13,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.bgCard,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: theme.textPrimary,
      fontSize: 12,
    },
    inputLabel: {
      color: theme.accent,
      fontSize: 11,
      fontWeight: "600",
      marginBottom: 6,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
      marginBottom: 12,
    },
    statBox: {
      flex: 1,
      backgroundColor: theme.bgCard,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    statValue: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.accent,
    },
    statLabel: {
      fontSize: 9,
      color: theme.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    subTabs: {
      flexDirection: "row",
      backgroundColor: theme.bgSecondary,
      borderRadius: 10,
      padding: 4,
      marginBottom: 12,
    },
    subTab: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: "center",
    },
    subTabActive: {
      backgroundColor: theme.accent,
    },
    subTabText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    subTabTextActive: {
      color: "white",
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.bgCard,
      marginBottom: 10,
    },
    filterRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
      flexWrap: "wrap",
    },
    filterTab: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.bgCard,
    },
    filterTabActive: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    filterTabText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    filterTabTextActive: {
      color: "white",
    },
    dropDown: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.accent,
      backgroundColor: theme.bgCard,
      paddingVertical: 8,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    dropDownText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.textPrimary,
    },
    dropDownMenu: {
      position: "absolute",
      top: 42,
      right: 0,
      width: 140,
      backgroundColor: theme.bgCard,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      zIndex: 10,
    },
    dropDownItem: {
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    dropDownItemText: {
      fontSize: 11,
      color: theme.textPrimary,
    },
    collectionSelector: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },
    collectionBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.bgCard,
    },
    collectionBtnActive: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    collectionBtnText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    collectionBtnTextActive: {
      color: "white",
    },
    deviceCard: {
      flex: 1,
      backgroundColor: theme.bgCard,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    deviceCardExpired: {
      borderColor: theme.danger,
    },
    deviceCardHighlight: {
      borderColor: theme.accent,
      shadowColor: theme.accent,
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 4,
    },
    positionTag: {
      alignSelf: "flex-end",
      backgroundColor: theme.accent,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginBottom: 4,
    },
    positionTagExpired: {
      backgroundColor: theme.danger,
    },
    positionText: {
      fontSize: 9,
      fontWeight: "700",
      color: "white",
    },
    deviceId: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.accent,
      marginBottom: 4,
    },
    deviceIdExpired: {
      color: theme.danger,
    },
    userNameCard: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.textPrimary,
      marginBottom: 6,
    },
    keyValue: {
      backgroundColor: theme.accentLight,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 6,
      textAlign: "center",
      fontSize: 12,
      color: theme.accent,
      marginBottom: 6,
    },
    keyValueExpired: {
      backgroundColor: "rgba(239,68,68,0.15)",
      color: theme.danger,
    },
    metaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    expiryText: {
      fontSize: 9,
      color: theme.textSecondary,
    },
    statusBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      fontSize: 8,
      fontWeight: "700",
    },
    badgeOnline: {
      backgroundColor: "rgba(16,185,129,0.2)",
      color: theme.success,
    },
    badgeOffline: {
      backgroundColor: "rgba(239,68,68,0.2)",
      color: theme.danger,
    },
    cardActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    actionBtn: {
      flex: 1,
      paddingVertical: 6,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    editBtn: {
      backgroundColor: "rgba(52,152,219,0.15)",
    },
    deleteBtn: {
      backgroundColor: "rgba(239,68,68,0.15)",
    },
    expiredLabel: {
      backgroundColor: theme.danger,
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginBottom: 4,
    },
    expiredLabelText: {
      color: "white",
      fontSize: 8,
      fontWeight: "700",
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    toggleSwitch: {
      width: 40,
      height: 22,
      borderRadius: 11,
      backgroundColor: "#ccc",
      padding: 2,
      justifyContent: "center",
    },
    toggleSwitchActive: {
      backgroundColor: theme.success,
    },
    toggleKnob: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: "white",
      alignSelf: "flex-start",
    },
    toggleKnobActive: {
      alignSelf: "flex-end",
    },
    bottomNav: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.bgCard,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      paddingVertical: 10,
      paddingBottom: 20,
    },
    navItem: {
      alignItems: "center",
      gap: 4,
    },
    navLabel: {
      fontSize: 10,
      color: theme.textSecondary,
    },
    navLabelActive: {
      color: theme.accent,
    },
    fab: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme.accent,
      alignItems: "center",
      justifyContent: "center",
      marginTop: -30,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      padding: 16,
    },
    modalCard: {
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.textPrimary,
      marginBottom: 10,
    },
    warningBox: {
      backgroundColor: "rgba(239,68,68,0.15)",
      borderRadius: 8,
      padding: 8,
      marginTop: 8,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 6,
    },
    warningText: {
      color: theme.danger,
      fontSize: 10,
      flex: 1,
    },
    toast: {
      position: "absolute",
      bottom: 110,
      left: 20,
      right: 20,
      backgroundColor: "#111",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      alignItems: "center",
    },
    toastText: {
      color: "white",
      fontSize: 12,
      fontWeight: "600",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 30,
    },
    emptyStateText: {
      color: theme.textSecondary,
      marginBottom: 10,
    },
    topBtn: {
      position: "absolute",
      right: 14,
      bottom: 110,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.bgCard,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    configCard: {
      backgroundColor: theme.bgSecondary,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
    },
    configLabel: {
      fontSize: 10,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    configValue: {
      fontSize: 12,
      color: theme.textPrimary,
    },
    themeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 10,
    },
    themeOption: {
      flexBasis: "48%",
      borderRadius: 10,
      padding: 12,
      alignItems: "center",
      borderWidth: 2,
      borderColor: "transparent",
    },
    themeOptionActive: {
      borderColor: "white",
    },
    setupContainer: {
      flex: 1,
      backgroundColor: "#0f1e3d",
      justifyContent: "center",
      padding: 16,
    },
    setupCard: {
      backgroundColor: "white",
      borderRadius: 18,
      overflow: "hidden",
    },
    setupHeader: {
      backgroundColor: "#1d4ed8",
      padding: 20,
      alignItems: "center",
    },
    setupHeaderText: {
      color: "white",
      fontWeight: "700",
      fontSize: 18,
    },
    setupBody: {
      padding: 16,
    },
    setupInfo: {
      backgroundColor: "#eff6ff",
      borderLeftWidth: 3,
      borderLeftColor: "#3b82f6",
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    setupTabRow: {
      flexDirection: "row",
      backgroundColor: "#f1f5f9",
      borderRadius: 10,
      padding: 4,
      gap: 4,
      marginBottom: 12,
    },
    setupTab: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: "center",
    },
    setupTabActive: {
      backgroundColor: "white",
    },
    setupTabText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#64748b",
    },
    setupTabTextActive: {
      color: "#2563eb",
    },
    setupTextarea: {
      borderWidth: 2,
      borderColor: "#cbd5e1",
      borderStyle: "dashed",
      borderRadius: 8,
      padding: 10,
      minHeight: 100,
      textAlignVertical: "top",
      fontSize: 11,
      color: "#334155",
      backgroundColor: "#f8fafc",
      marginBottom: 10,
    },
    setupBtn: {
      backgroundColor: "#1d4ed8",
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
    },
    setupBtnText: {
      color: "white",
      fontSize: 13,
      fontWeight: "700",
    },
    setupError: {
      backgroundColor: "#fee2e2",
      color: "#dc2626",
      padding: 8,
      borderRadius: 6,
      fontSize: 11,
      marginTop: 8,
    },
    suggestionBox: {
      borderWidth: 1,
      borderColor: theme.accent,
      borderRadius: 8,
      marginTop: 6,
      overflow: "hidden",
      backgroundColor: theme.bgCard,
    },
    suggestionItem: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    suggestionText: {
      fontSize: 11,
      color: theme.textPrimary,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.bgSecondary,
      padding: 10,
      borderRadius: 8,
      marginBottom: 12,
    },
    statusText: {
      fontSize: 10,
      color: theme.textSecondary,
    },
    statusBtn: {
      backgroundColor: theme.accent,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
    },
    statusBtnText: {
      fontSize: 10,
      color: "white",
      fontWeight: "600",
    },
    fireOverlay: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 140,
      zIndex: 0,
    },
    fireFlame: {
      position: "absolute",
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(255,152,0,0.25)",
    },
  });

const FireOverlay = ({ visible }) => {
  const flames = useMemo(
    () => [
      new Animated.Value(0),
      new Animated.Value(0),
      new Animated.Value(0),
      new Animated.Value(0),
      new Animated.Value(0),
    ],
    []
  );

  useEffect(() => {
    if (!visible) return;
    flames.forEach((val, index) => {
      val.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 180),
          Animated.timing(val, {
            toValue: 1,
            duration: 2000 + index * 300,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 2000 + index * 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [visible, flames]);

  if (!visible) return null;
  return (
    <View pointerEvents="none" style={stylesBase.fireOverlay}>
      {flames.map((val, index) => {
        const translateY = val.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -40 - index * 6],
        });
        const opacity = val.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 0.8],
        });
        const scale = val.interpolate({
          inputRange: [0, 1],
          outputRange: [0.7, 1.2],
        });
        return (
          <Animated.View
            key={`flame-${index}`}
            style={[
              stylesBase.fireFlame,
              {
                left: 20 + index * 60,
                opacity,
                transform: [{ translateY }, { scale }],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const stylesBase = createStyles(THEMES.cream);

export default function Index() {
  const [theme, setTheme] = useState("cream");
  const styles = useMemo(() => createStyles(THEMES[theme]), [theme]);
  const [storedConfig, setStoredConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [setupTab, setSetupTab] = useState("paste");
  const [setupPaste, setSetupPaste] = useState("");
  const [setupForm, setSetupForm] = useState({
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    adminEmail: "",
  });
  const [setupError, setSetupError] = useState("");
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberLogin, setRememberLogin] = useState(true);
  const [activeTab, setActiveTab] = useState("devices");
  const [subTab, setSubTab] = useState("keys");
  const [collections, setCollections] = useState([]);
  const [currentCollection, setCurrentCollection] = useState("");
  const [currentData, setCurrentData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [daysFilter, setDaysFilter] = useState("all");
  const [daysOpen, setDaysOpen] = useState(false);
  const [rawJson, setRawJson] = useState("");
  const [firebaseStatus, setFirebaseStatus] = useState("Idle");
  const [keyModalVisible, setKeyModalVisible] = useState(false);
  const [currentUpdateId, setCurrentUpdateId] = useState(null);
  const [keyForm, setKeyForm] = useState({
    deviceId: "",
    key: "",
    expiry: "",
    user: "",
    allowOffline: false,
    position: "",
  });
  const [positionSuggestions, setPositionSuggestions] = useState([]);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [showTop, setShowTop] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [successModal, setSuccessModal] = useState({
    visible: false,
    entry: null,
    position: 0,
    isUpdate: false,
  });
  const [collectionModalVisible, setCollectionModalVisible] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [collectionNameInput, setCollectionNameInput] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [confirmState, setConfirmState] = useState({
    visible: false,
    title: "",
    message: "",
  });
  const confirmResolveRef = useRef(null);
  const listRef = useRef(null);
  const authRef = useRef(null);
  const dbRefCurrent = useRef(null);
  const autoLoginAttempted = useRef(false);

  const showToast = useCallback(
    (message) => {
      setToastMessage(message);
      setToastVisible(true);
      toastAnim.setValue(0);
      Animated.sequence([
        Animated.timing(toastAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.delay(1600),
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => setToastVisible(false));
    },
    [toastAnim]
  );

  const confirmAction = useCallback((title, message) => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmState({ visible: true, title, message });
    });
  }, []);

  const handleConfirm = (value) => {
    setConfirmState((prev) => ({ ...prev, visible: false }));
    if (confirmResolveRef.current) {
      confirmResolveRef.current(value);
      confirmResolveRef.current = null;
    }
  };

  const resetFirebaseInstance = useCallback(async () => {
    if (getApps().length > 0) {
      await Promise.all(getApps().map((app) => deleteApp(app)));
    }
  }, []);

  const initFirebase = useCallback(
    async (config) => {
      try {
        await resetFirebaseInstance();
        const app = initializeApp(config.fc);
        authRef.current = getAuth(app);
        dbRefCurrent.current = getDatabase(app);
        return true;
      } catch (e) {
        return false;
      }
    },
    [resetFirebaseInstance]
  );

  useEffect(() => {
    const loadStored = async () => {
      try {
        const cfg = await AsyncStorage.getItem("fb_cfg");
        const themeValue = await AsyncStorage.getItem("theme");
        if (themeValue && themeValue in THEMES) {
          setTheme(themeValue);
        }
        if (cfg) {
          const parsed = JSON.parse(cfg);
          const valid = parsed?.fc && parsed?.email;
          if (valid) {
            setStoredConfig(parsed);
            const ok = await initFirebase(parsed);
            if (!ok) {
              await AsyncStorage.removeItem("fb_cfg");
              setStoredConfig(null);
            }
          }
        } else {
          await AsyncStorage.setItem("fb_cfg", JSON.stringify(DEFAULT_CONFIG));
          setStoredConfig(DEFAULT_CONFIG);
          await initFirebase(DEFAULT_CONFIG);
        }
      } catch (e) {
        setStoredConfig(null);
      } finally {
        setConfigLoading(false);
      }
    };
    loadStored();
  }, [initFirebase]);

  useEffect(() => {
    if (!storedConfig || !authRef.current) return;
    const auth = authRef.current;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email === storedConfig.email) {
        setAuthUser(user);
        return;
      }
      if (user && user.email !== storedConfig.email) {
        await signOut(auth);
      }
      setAuthUser(null);
    });
    return () => unsubscribe();
  }, [storedConfig]);

  useEffect(() => {
    const loadSavedLogin = async () => {
      const savedEmail = await AsyncStorage.getItem("savedEmail");
      const savedPassword = await AsyncStorage.getItem("savedPassword");
      if (savedEmail && savedPassword) {
        setLoginEmail(savedEmail);
        setLoginPassword(savedPassword);
        setRememberLogin(true);
      } else if (storedConfig?.email) {
        setLoginEmail(storedConfig.email);
      }
    };
    loadSavedLogin();
  }, [storedConfig]);

  useEffect(() => {
    const tryAutoLogin = async () => {
      if (autoLoginAttempted.current || !storedConfig || !authRef.current) return;
      autoLoginAttempted.current = true;
      const savedEmail = await AsyncStorage.getItem("savedEmail");
      const savedPassword = await AsyncStorage.getItem("savedPassword");
      if (!savedEmail || !savedPassword) return;
      try {
        setAuthLoading(true);
        const result = await signInWithEmailAndPassword(
          authRef.current,
          savedEmail.trim(),
          savedPassword.trim()
        );
        if (result.user.email !== storedConfig.email) {
          await signOut(authRef.current);
          return;
        }
        setAuthUser(result.user);
      } catch (e) {
        setAuthError("Auto login failed");
      } finally {
        setAuthLoading(false);
      }
    };
    tryAutoLogin();
  }, [storedConfig]);

  const loadCollections = useCallback(async () => {
    if (!dbRefCurrent.current) return;
    try {
      const snapshot = await get(dbRef(dbRefCurrent.current, "/"));
      const data = snapshot.val();
      if (!data) {
        setCollections([]);
        setCurrentCollection("");
        setAllData([]);
        setCurrentData([]);
        return;
      }
      const keys = Object.keys(data);
      setCollections(keys);
      if (!currentCollection || !keys.includes(currentCollection)) {
        setCurrentCollection(keys[0]);
      }
    } catch (e) {
      showToast("Failed to load collections");
    }
  }, [currentCollection, showToast]);

  useEffect(() => {
    if (!authUser || !dbRefCurrent.current || !currentCollection) return;
    setFirebaseStatus("Loading...");
    const collectionRef = dbRef(dbRefCurrent.current, currentCollection);
    const unsubscribe = onValue(
      collectionRef,
      (snapshot) => {
        const val = snapshot.val();
        let dataArray = [];
        if (Array.isArray(val)) {
          dataArray = val.filter((item) => item !== null);
        } else if (val && typeof val === "object") {
          dataArray = Object.keys(val).map((key) => ({ id: key, ...val[key] }));
        }
        setCurrentData(dataArray);
        setAllData(dataArray);
        setRawJson(JSON.stringify(dataArray, null, 2));
        setFirebaseStatus("Connected");
      },
      () => {
        setFirebaseStatus("Error");
      }
    );
    return () => unsubscribe();
  }, [authUser, currentCollection]);

  useEffect(() => {
    if (authUser) {
      loadCollections();
    }
  }, [authUser, loadCollections]);

  const saveData = useCallback(
    async (data) => {
      if (!dbRefCurrent.current || !currentCollection) return false;
      setFirebaseStatus("Saving...");
      try {
        await set(dbRef(dbRefCurrent.current, currentCollection), data);
        setFirebaseStatus("Saved");
        return true;
      } catch (e) {
        setFirebaseStatus("Error");
        showToast("Save failed");
        return false;
      }
    },
    [currentCollection, showToast]
  );

  const filteredData = useMemo(() => {
    let data = [...allData];
    if (filterStatus === "active") {
      data = data.filter((item) => !isExpired(item.expirydate));
    }
    if (filterStatus === "expired") {
      data = data.filter((item) => isExpired(item.expirydate));
    }
    if (daysFilter !== "all") {
      const today = new Date();
      data = data.filter((item) => {
        const exp = parseDate(item.expirydate);
        if (!exp) return false;
        const diffDays = Math.ceil(
          (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysFilter === "7") return diffDays > 0 && diffDays <= 7;
        if (daysFilter === "15") return diffDays > 0 && diffDays <= 15;
        if (daysFilter === "30") return diffDays > 0 && diffDays <= 30;
        if (daysFilter === "30+") return diffDays > 30;
        return true;
      });
    }
    if (searchValue) {
      const lower = searchValue.toLowerCase();
      data = data.filter(
        (item) =>
          (item.device_id || item.id || "").toLowerCase().includes(lower) ||
          (item.user || "").toLowerCase().includes(lower) ||
          (item.key || "").toLowerCase().includes(lower)
      );
    }
    return data;
  }, [allData, filterStatus, daysFilter, searchValue]);

  const stats = useMemo(() => {
    let active = 0;
    let expired = 0;
    allData.forEach((item) => {
      if (isExpired(item.expirydate)) expired += 1;
      else active += 1;
    });
    return {
      total: allData.length,
      active,
      expired,
    };
  }, [allData]);

  const openKeyModal = (entry) => {
    if (entry) {
      const id = entry.device_id || entry.id || "";
      setCurrentUpdateId(id);
      setKeyForm({
        deviceId: id,
        key: entry.key || "",
        expiry: entry.expirydate || "",
        user: entry.user || "",
        allowOffline: entry.Allowoffline || false,
        position: String(
          allData.findIndex((x) => (x.device_id || x.id) === id) + 1
        ),
      });
    } else {
      setCurrentUpdateId(null);
      setKeyForm({
        deviceId: "",
        key: "",
        expiry: "",
        user: "",
        allowOffline: false,
        position: "",
      });
    }
    setPositionSuggestions([]);
    setUserSuggestions([]);
    setKeyModalVisible(true);
  };

  const closeKeyModal = () => {
    setKeyModalVisible(false);
    setCurrentUpdateId(null);
  };

  const duplicateDevice = useMemo(() => {
    if (!keyForm.deviceId || currentUpdateId) return null;
    return allData.find(
      (item) => (item.device_id || item.id) === keyForm.deviceId
    );
  }, [keyForm.deviceId, currentUpdateId, allData]);

  const duplicateKey = useMemo(() => {
    if (!keyForm.key) return false;
    const existing = allData.find(
      (item) => item.key === keyForm.key && (item.device_id || item.id) !== currentUpdateId
    );
    return Boolean(existing);
  }, [keyForm.key, currentUpdateId, allData]);

  const handleGenerateKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let generated = "";
    const existingKeys = allData.map((item) => item.key);
    do {
      generated = "";
      for (let i = 0; i < 12; i += 1) {
        generated += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (existingKeys.includes(generated));
    setKeyForm((prev) => ({ ...prev, key: generated }));
  };

  const handleSaveKey = async () => {
    const { deviceId, key, expiry, user, allowOffline, position } = keyForm;
    if (!deviceId || !key || !expiry || !user) {
      showToast("Please fill all fields");
      return;
    }
    if (duplicateKey) {
      showToast("Duplicate key detected");
      return;
    }
    let pos = parseInt(position, 10);
    if (!pos || pos < 1) pos = allData.length + 1;
    if (pos > allData.length + 1) pos = allData.length + 1;
    const entry = {
      device_id: deviceId,
      key,
      expirydate: expiry,
      user,
      Allowoffline: allowOffline,
    };
    let updated = [...allData];
    if (currentUpdateId) {
      const idx = updated.findIndex(
        (item) => (item.device_id || item.id) === currentUpdateId
      );
      if (idx !== -1) updated.splice(idx, 1);
    }
    updated.splice(pos - 1, 0, entry);
    const ok = await saveData(updated);
    if (ok) {
      setSuccessModal({
        visible: true,
        entry,
        position: pos,
        isUpdate: Boolean(currentUpdateId),
      });
      closeKeyModal();
      setHighlightId(entry.device_id || "");
      setTimeout(() => setHighlightId(null), 1500);
    }
  };

  const handleToggleYear = async (id, fullYear) => {
    const updated = [...allData];
    const idx = updated.findIndex(
      (item) => (item.device_id || item.id) === id
    );
    if (idx === -1) return;
    const parts = (updated[idx].expirydate || "01-01-2026").split("-");
    updated[idx].expirydate = `${parts[0]}-${parts[1]}-${
      fullYear ? "2026" : "20"
    }`;
    const ok = await saveData(updated);
    if (ok) {
      showToast(fullYear ? "Enabled" : "Disabled");
    }
  };

  const handleDeleteKey = async (id) => {
    const ok = await confirmAction("Delete Key", `Delete device ${id}?`);
    if (!ok) return;
    const updated = allData.filter(
      (item) => (item.device_id || item.id) !== id
    );
    const saved = await saveData(updated);
    if (saved) showToast("Deleted");
  };

  const handleCopy = async (value) => {
    if (!value) return;
    await Clipboard.setStringAsync(value);
    showToast("Copied");
  };

  const scrollToDevice = (id) => {
    const index = filteredData.findIndex(
      (item) => (item.device_id || item.id) === id
    );
    if (index !== -1) {
      listRef.current?.scrollToIndex({ index, animated: true });
      setHighlightId(id);
      setTimeout(() => setHighlightId(null), 1500);
    }
  };

  const handleSaveJson = async () => {
    try {
      const parsed = JSON.parse(rawJson);
      const ok = await saveData(parsed);
      if (ok) showToast("Saved");
    } catch (e) {
      showToast("Invalid JSON");
    }
  };

  const handleFormatJson = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(rawJson), null, 2);
      setRawJson(formatted);
      showToast("Formatted");
    } catch (e) {
      showToast("Invalid JSON");
    }
  };

  const handleResetJson = () => {
    setRawJson(JSON.stringify(allData, null, 2));
    showToast("Reset");
  };

  const handleAddCollection = async () => {
    if (!newCollectionName.trim()) {
      showToast("Enter collection name");
      return;
    }
    if (collections.includes(newCollectionName.trim())) {
      showToast("Collection already exists");
      return;
    }
    const defaultData = [
      {
        Allowoffline: false,
        device_id: "b7fcd04f7c59af3d",
        expirydate: "31-01-2030",
        key: "opjat",
        user: "omprakash",
      },
    ];
    try {
      await set(dbRef(dbRefCurrent.current, newCollectionName.trim()), defaultData);
      setNewCollectionName("");
      showToast("Collection added");
      loadCollections();
    } catch (e) {
      showToast("Error adding collection");
    }
  };

  const handleRenameCollection = async () => {
    if (!editingCollection) return;
    const newName = collectionNameInput.trim();
    if (!newName) {
      showToast("Enter collection name");
      return;
    }
    if (collections.includes(newName)) {
      showToast("Collection already exists");
      return;
    }
    try {
      const snapshot = await get(
        dbRef(dbRefCurrent.current, editingCollection)
      );
      const data = snapshot.val();
      await set(dbRef(dbRefCurrent.current, newName), data || []);
      await remove(dbRef(dbRefCurrent.current, editingCollection));
      if (currentCollection === editingCollection) {
        setCurrentCollection(newName);
      }
      showToast("Collection renamed");
      setCollectionModalVisible(false);
      setEditingCollection(null);
      setCollectionNameInput("");
      loadCollections();
    } catch (e) {
      showToast("Rename failed");
    }
  };

  const handleDeleteCollection = async (name) => {
    if (collections.length <= 1) {
      showToast("Cannot delete last collection");
      return;
    }
    const ok = await confirmAction(
      "Delete Collection",
      `Delete collection "${name}"? This will delete all keys.`
    );
    if (!ok) return;
    try {
      await remove(dbRef(dbRefCurrent.current, name));
      showToast("Collection deleted");
      loadCollections();
    } catch (e) {
      showToast("Delete failed");
    }
  };

  const handleMoveCollection = (name, direction) => {
    const idx = collections.indexOf(name);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= collections.length) return;
    const updated = [...collections];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setCollections(updated);
  };

  const handleEmailLogin = async () => {
    if (!authRef.current || !storedConfig) {
      showToast("Firebase setup required");
      return;
    }
    if (!loginEmail || !loginPassword) {
      setAuthError("Email and password required");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const result = await signInWithEmailAndPassword(
        authRef.current,
        loginEmail.trim(),
        loginPassword.trim()
      );
      if (result.user.email !== storedConfig.email) {
        await signOut(authRef.current);
        setAuthError("Access denied: email not authorized.");
        setAuthLoading(false);
        return;
      }
      await AsyncStorage.setItem("loginTimestamp", Date.now().toString());
      if (rememberLogin) {
        await AsyncStorage.setItem("savedEmail", loginEmail.trim());
        await AsyncStorage.setItem("savedPassword", loginPassword.trim());
      } else {
        await AsyncStorage.removeItem("savedEmail");
        await AsyncStorage.removeItem("savedPassword");
      }
      setAuthUser(result.user);
      showToast("Login successful");
    } catch (e) {
      setAuthError(e?.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    const ok = await confirmAction("Logout", "Are you sure you want to logout?");
    if (!ok) return;
    await AsyncStorage.removeItem("loginTimestamp");
    if (authRef.current) {
      await signOut(authRef.current);
    }
    setAuthUser(null);
  };

  const handleResetConfig = async () => {
    const ok = await confirmAction(
      "Reset Firebase Config",
      "Reset your Firebase config and setup a new one?"
    );
    if (!ok) return;
    await AsyncStorage.removeItem("fb_cfg");
    await AsyncStorage.removeItem("loginTimestamp");
    await AsyncStorage.removeItem("savedEmail");
    await AsyncStorage.removeItem("savedPassword");
    setStoredConfig(null);
    setAuthUser(null);
  };

  const handleSaveSetup = async () => {
    const {
      apiKey,
      authDomain,
      databaseURL,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
      adminEmail,
    } = setupForm;
    if (!apiKey || !authDomain || !databaseURL || !projectId || !adminEmail) {
      setSetupError(
        "API Key, Auth Domain, Database URL, Project ID and Admin Email are required."
      );
      return;
    }
    if (!adminEmail.includes("@")) {
      setSetupError("Enter a valid admin email");
      return;
    }
    const payload = {
      fc: {
        apiKey,
        authDomain,
        databaseURL,
        projectId,
        storageBucket,
        messagingSenderId,
        appId,
      },
      email: adminEmail,
    };
    await AsyncStorage.setItem("fb_cfg", JSON.stringify(payload));
    const ok = await initFirebase(payload);
    if (!ok) {
      setSetupError("Firebase init failed. Check config.");
      return;
    }
    setStoredConfig(payload);
    setSetupError("");
  };

  const handleParseConfig = () => {
    const text = setupPaste;
    const keys = [
      "apiKey",
      "authDomain",
      "databaseURL",
      "projectId",
      "storageBucket",
      "messagingSenderId",
      "appId",
    ];
    let found = 0;
    const updated = { ...setupForm };
    keys.forEach((key) => {
      const match = text.match(new RegExp(`${key}\\s*:\\s*[\"'](.*?)[\"']`));
      if (match) {
        updated[key] = match[1];
        found += 1;
      }
    });
    setSetupForm(updated);
    if (found > 0) {
      setSetupTab("manual");
      showToast(`${found} fields parsed. Add admin email.`);
    } else {
      showToast("Config not parsed. Use manual tab.");
    }
  };

  const handleQuickDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setKeyForm((prev) => ({ ...prev, expiry: formatDate(date) }));
  };

  const handleAdjustDate = (days) => {
    if (!keyForm.expiry) return;
    const parsed = parseDate(keyForm.expiry);
    if (!parsed) return;
    parsed.setDate(parsed.getDate() + days);
    setKeyForm((prev) => ({ ...prev, expiry: formatDate(parsed) }));
  };

  const handleUsernameInput = (value) => {
    setKeyForm((prev) => ({ ...prev, user: value }));
    if (!value) {
      setUserSuggestions([]);
      return;
    }
    const matches = [
      ...new Set(
        allData
          .map((item) => item.user)
          .filter((name) =>
            Boolean(name && name.toLowerCase().includes(value.toLowerCase()))
          )
      ),
    ].slice(0, 5);
    setUserSuggestions(matches);
  };

  const handlePositionInput = (value) => {
    setKeyForm((prev) => ({ ...prev, position: value }));
    if (!value || /^\d+$/.test(value)) {
      setPositionSuggestions([]);
      return;
    }
    const matches = allData
      .filter((item) =>
        (item.user || "").toLowerCase().includes(value.toLowerCase())
      )
      .slice(0, 5)
      .map((item) => ({
        position:
          allData.findIndex(
            (d) => (d.device_id || d.id) === (item.device_id || item.id)
          ) + 1,
        user: item.user || "",
      }));
    setPositionSuggestions(matches);
  };

  const handleThemeChange = async (next) => {
    setTheme(next);
    await AsyncStorage.setItem("theme", next);
  };

  const renderDeviceCard = ({ item, index }) => {
    const id = item.device_id || item.id || "";
    const expired = isExpired(item.expirydate);
    const position = allData.findIndex(
      (d) => (d.device_id || d.id) === id
    );
    const parts = (item.expirydate || "01-01-2026").split("-");
    const hasFullYear = parts[2] && parts[2].length === 4;
    return (
      <View
        style={[
          styles.deviceCard,
          expired && styles.deviceCardExpired,
          highlightId === id && styles.deviceCardHighlight,
          { marginRight: index % 2 === 0 ? 8 : 0 },
        ]}
      >
        <View
          style={[
            styles.positionTag,
            expired && styles.positionTagExpired,
          ]}
        >
          <Text style={styles.positionText}>#{position + 1}</Text>
        </View>
        <Text
          style={[styles.deviceId, expired && styles.deviceIdExpired]}
          numberOfLines={1}
        >
          {id}
        </Text>
        <Text style={styles.userNameCard} numberOfLines={1}>
          {item.user || "N/A"}
        </Text>
        <Pressable onPress={() => handleCopy(item.key)}>
          <Text
            style={[
              styles.keyValue,
              expired && styles.keyValueExpired,
            ]}
            numberOfLines={1}
          >
            {item.key || "N/A"}
          </Text>
        </Pressable>
        <View style={styles.metaRow}>
          <Text style={styles.expiryText}>{item.expirydate || "N/A"}</Text>
          <Text
            style={[
              styles.statusBadge,
              item.Allowoffline ? styles.badgeOffline : styles.badgeOnline,
            ]}
          >
            {item.Allowoffline ? "OFFLINE" : "ONLINE"}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => openKeyModal(item)}
          >
            <MaterialCommunityIcons
              name="pencil"
              size={16}
              color="#3498db"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDeleteKey(id)}
          >
            <MaterialCommunityIcons
              name="trash-can"
              size={16}
              color={THEMES[theme].danger}
            />
          </TouchableOpacity>
          <View>
            {expired ? (
              <View style={styles.expiredLabel}>
                <Text style={styles.expiredLabelText}>EXPIRED</Text>
              </View>
            ) : null}
            <Pressable
              style={[
                styles.toggleSwitch,
                hasFullYear && styles.toggleSwitchActive,
              ]}
              onPress={() => handleToggleYear(id, !hasFullYear)}
            >
              <View
                style={[
                  styles.toggleKnob,
                  hasFullYear && styles.toggleKnobActive,
                ]}
              />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const previewFullYear = useMemo(() => {
    if (!successModal.entry) return false;
    const parts = (successModal.entry.expirydate || "01-01-2026").split("-");
    return Boolean(parts[2] && parts[2].length === 4);
  }, [successModal.entry]);

  if (configLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={THEMES[theme].accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!storedConfig) {
    return (
      <SafeAreaView style={styles.setupContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.setupCard}>
              <View style={styles.setupHeader}>
                <Text style={styles.setupHeaderText}>Firebase Admin Setup</Text>
                <Text style={{ color: "white", fontSize: 11, marginTop: 4 }}>
                  Configure your Firebase project
                </Text>
              </View>
              <View style={styles.setupBody}>
                <View style={styles.setupInfo}>
                  <Text style={{ fontSize: 11, color: "#1d4ed8" }}>
                    1. Firebase Console → Project Settings{`\n`}
                    2. Copy your web app config{`\n`}
                    3. Paste it below or fill manually
                  </Text>
                </View>
                <View style={styles.setupTabRow}>
                  <Pressable
                    style={[
                      styles.setupTab,
                      setupTab === "paste" && styles.setupTabActive,
                    ]}
                    onPress={() => setSetupTab("paste")}
                  >
                    <Text
                      style={[
                        styles.setupTabText,
                        setupTab === "paste" && styles.setupTabTextActive,
                      ]}
                    >
                      Config Paste
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.setupTab,
                      setupTab === "manual" && styles.setupTabActive,
                    ]}
                    onPress={() => setSetupTab("manual")}
                  >
                    <Text
                      style={[
                        styles.setupTabText,
                        setupTab === "manual" && styles.setupTabTextActive,
                      ]}
                    >
                      Manual Fill
                    </Text>
                  </Pressable>
                </View>
                {setupTab === "paste" ? (
                  <View>
                    <TextInput
                      style={styles.setupTextarea}
                      placeholder="Paste firebaseConfig object here"
                      placeholderTextColor="#94a3b8"
                      multiline
                      value={setupPaste}
                      onChangeText={setSetupPaste}
                    />
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: "#16a34a" }]}
                      onPress={handleParseConfig}
                    >
                      <Text style={styles.primaryBtnText}>Parse Config</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    {[
                      { label: "API Key", key: "apiKey" },
                      { label: "Auth Domain", key: "authDomain" },
                      { label: "Database URL", key: "databaseURL" },
                      { label: "Project ID", key: "projectId" },
                      { label: "Storage Bucket", key: "storageBucket" },
                      { label: "Messaging Sender ID", key: "messagingSenderId" },
                      { label: "App ID", key: "appId" },
                    ].map((field) => (
                      <View key={field.key} style={{ marginBottom: 10 }}>
                        <Text style={styles.inputLabel}>{field.label}</Text>
                        <TextInput
                          style={styles.input}
                          value={setupForm[field.key]}
                          onChangeText={(value) =>
                            setSetupForm((prev) => ({ ...prev, [field.key]: value }))
                          }
                        />
                      </View>
                    ))}
                  </View>
                )}
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.inputLabel}>Admin Email</Text>
                  <TextInput
                    style={styles.input}
                    value={setupForm.adminEmail}
                    onChangeText={(value) =>
                      setSetupForm((prev) => ({ ...prev, adminEmail: value }))
                    }
                  />
                </View>
                {setupError ? <Text style={styles.setupError}>{setupError}</Text> : null}
                <TouchableOpacity
                  style={[styles.setupBtn, { marginTop: 16 }]}
                  onPress={handleSaveSetup}
                >
                  <Text style={styles.setupBtnText}>Complete Setup</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (!authUser) {
    return (
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={[styles.card, { marginTop: 20 }]}
              >
              <Text style={[styles.sectionTitle, { fontSize: 14 }]}>Admin Login</Text>
              <View style={styles.infoBox}>
                <Text style={[styles.infoText, { fontWeight: "600" }]}
                  >Authorized access only</Text>
                <Text style={styles.infoText}
                  >Only authorized administrators can access this panel.</Text>
              </View>
              <TextInput
                style={[styles.input, { marginBottom: 8 }]}
                placeholder="Admin Email"
                placeholderTextColor={THEMES[theme].textSecondary}
                value={loginEmail}
                onChangeText={setLoginEmail}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={THEMES[theme].textSecondary}
                value={loginPassword}
                onChangeText={setLoginPassword}
                secureTextEntry
              />
              <Pressable
                style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}
                onPress={() => setRememberLogin((prev) => !prev)}
              >
                <MaterialCommunityIcons
                  name={rememberLogin ? "checkbox-marked" : "checkbox-blank-outline"}
                  size={18}
                  color={THEMES[theme].accent}
                />
                <Text style={{ color: THEMES[theme].textPrimary, fontSize: 12 }}>
                  Remember my login
                </Text>
              </Pressable>
              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 12 }]}
                onPress={handleEmailLogin}
                disabled={authLoading}
              >
                {authLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <MaterialCommunityIcons name="lock" size={18} color="white" />
                )}
                <Text style={styles.primaryBtnText}>Login with Email</Text>
              </TouchableOpacity>
              {authError ? (
                <Text style={{ color: THEMES[theme].danger, marginTop: 10, fontSize: 11 }}>
                  {authError}
                </Text>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  { marginTop: 16, backgroundColor: "rgba(239,68,68,0.1)" },
                ]}
                onPress={handleResetConfig}
              >
                <Text style={[styles.primaryBtnText, { color: THEMES[theme].danger }]}>
                  Reset Firebase Config
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <MaterialCommunityIcons name="firebase" size={20} color="white" />
          <Text style={styles.headerTitleText}>OP Admin Panel</Text>
        </View>
        <View style={styles.userInfo}>
          <View>
            <Text style={styles.userName} numberOfLines={1}>
              {authUser.displayName || "Admin"}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {authUser.email}
            </Text>
          </View>
          <View style={styles.userAvatar}>
            <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>
              {(authUser.displayName || "A").charAt(0).toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FireOverlay visible={theme === "firebase"} />
      <View style={{ flex: 1, paddingHorizontal: 12, paddingTop: 12 }}>
        {activeTab === "devices" ? (
          subTab === "keys" ? (
            <FlatList
              ref={listRef}
              data={filteredData}
              numColumns={2}
              keyExtractor={(item, idx) =>
                `${item.device_id || item.id || idx}`
              }
              ListHeaderComponent={
                <View>
                  <Text style={styles.sectionTitle}>Collection</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.collectionSelector}>
                      {collections.map((name) => (
                        <Pressable
                          key={name}
                          style={[
                            styles.collectionBtn,
                            currentCollection === name && styles.collectionBtnActive,
                          ]}
                          onPress={() => {
                            setCurrentCollection(name);
                            showToast(name);
                          }}
                        >
                          <Text
                            style={[
                              styles.collectionBtnText,
                              currentCollection === name && styles.collectionBtnTextActive,
                            ]}
                          >
                            {name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{stats.total}</Text>
                      <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{stats.active}</Text>
                      <Text style={styles.statLabel}>Active</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{stats.expired}</Text>
                      <Text style={styles.statLabel}>Expired</Text>
                    </View>
                  </View>
                  <View style={styles.subTabs}>
                    {[
                      { key: "keys", label: "Keys" },
                      { key: "json", label: "JSON" },
                    ].map((tab) => (
                      <Pressable
                        key={tab.key}
                        style={[
                          styles.subTab,
                          subTab === tab.key && styles.subTabActive,
                        ]}
                        onPress={() => setSubTab(tab.key)}
                      >
                        <Text
                          style={[
                            styles.subTabText,
                            subTab === tab.key && styles.subTabTextActive,
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.searchBar}>
                    <MaterialCommunityIcons
                      name="magnify"
                      size={16}
                      color={THEMES[theme].textSecondary}
                    />
                    <TextInput
                      style={{ flex: 1, color: THEMES[theme].textPrimary, fontSize: 12 }}
                      placeholder="Search device, user, key"
                      placeholderTextColor={THEMES[theme].textSecondary}
                      value={searchValue}
                      onChangeText={setSearchValue}
                    />
                  </View>
                  <View style={styles.filterRow}>
                    {[
                      { key: "all", label: "All" },
                      { key: "active", label: "Active" },
                      { key: "expired", label: "Expired" },
                    ].map((filter) => (
                      <Pressable
                        key={filter.key}
                        style={[
                          styles.filterTab,
                          filterStatus === filter.key && styles.filterTabActive,
                        ]}
                        onPress={() => setFilterStatus(filter.key)}
                      >
                        <Text
                          style={[
                            styles.filterTabText,
                            filterStatus === filter.key && styles.filterTabTextActive,
                          ]}
                        >
                          {filter.label}
                        </Text>
                      </Pressable>
                    ))}
                    <View style={{ position: "relative" }}>
                      <Pressable
                        style={styles.dropDown}
                        onPress={() => setDaysOpen((prev) => !prev)}
                      >
                        <Text style={styles.dropDownText}>
                          {daysFilter === "all" ? "All Days" : `${daysFilter} Days`}
                        </Text>
                        <MaterialCommunityIcons
                          name={daysOpen ? "chevron-up" : "chevron-down"}
                          size={16}
                          color={THEMES[theme].textPrimary}
                        />
                      </Pressable>
                      {daysOpen && (
                        <View style={styles.dropDownMenu}>
                          {[
                            { label: "All Days", value: "all" },
                            { label: "7 Days", value: "7" },
                            { label: "15 Days", value: "15" },
                            { label: "30 Days", value: "30" },
                            { label: "30+ Days", value: "30+" },
                          ].map((option) => (
                            <Pressable
                              key={option.value}
                              style={styles.dropDownItem}
                              onPress={() => {
                                setDaysFilter(option.value);
                                setDaysOpen(false);
                              }}
                            >
                              <Text style={styles.dropDownItemText}>{option.label}</Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              }
              renderItem={renderDeviceCard}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No keys found</Text>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => openKeyModal()}
                  >
                    <Text style={styles.primaryBtnText}>Add Key</Text>
                  </TouchableOpacity>
                </View>
              }
              onScroll={(event) => {
                setShowTop(event.nativeEvent.contentOffset.y > 200);
              }}
              scrollEventThrottle={16}
              contentContainerStyle={{ paddingBottom: 180 }}
            />
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
              <Text style={styles.sectionTitle}>Collection</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.collectionSelector}>
                  {collections.map((name) => (
                    <Pressable
                      key={name}
                      style={[
                        styles.collectionBtn,
                        currentCollection === name && styles.collectionBtnActive,
                      ]}
                      onPress={() => {
                        setCurrentCollection(name);
                        showToast(name);
                      }}
                    >
                      <Text
                        style={[
                          styles.collectionBtnText,
                          currentCollection === name && styles.collectionBtnTextActive,
                        ]}
                      >
                        {name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stats.total}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stats.active}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stats.expired}</Text>
                  <Text style={styles.statLabel}>Expired</Text>
                </View>
              </View>
              <View style={styles.subTabs}>
                {[
                  { key: "keys", label: "Keys" },
                  { key: "json", label: "JSON" },
                ].map((tab) => (
                  <Pressable
                    key={tab.key}
                    style={[styles.subTab, subTab === tab.key && styles.subTabActive]}
                    onPress={() => setSubTab(tab.key)}
                  >
                    <Text
                      style={[
                        styles.subTabText,
                        subTab === tab.key && styles.subTabTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={[styles.card, { padding: 12 }]}
              >
                <Text style={styles.sectionTitle}>Raw JSON</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      minHeight: 220,
                      textAlignVertical: "top",
                      fontFamily: Platform.select({ ios: "Courier", android: "monospace" }),
                    },
                  ]}
                  multiline
                  value={rawJson}
                  onChangeText={setRawJson}
                />
                <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                  <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleSaveJson}>
                    <Text style={styles.primaryBtnText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.primaryBtn, { flex: 1, backgroundColor: "#3498db" }]} onPress={handleFormatJson}>
                    <Text style={styles.primaryBtnText}>Format</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.primaryBtn, { flex: 1, backgroundColor: "#9b59b6" }]} onPress={() => handleCopy(rawJson)}>
                    <Text style={styles.primaryBtnText}>Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.primaryBtn, { flex: 1, backgroundColor: "#95a5a6" }]} onPress={handleResetJson}>
                    <Text style={styles.primaryBtnText}>Reset</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>Firebase: {firebaseStatus}</Text>
              <TouchableOpacity style={styles.statusBtn} onPress={loadCollections}>
                <Text style={styles.statusBtnText}>Refresh</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Firebase Config</Text>
              <View style={styles.configCard}>
                <Text style={styles.configLabel}>Project ID</Text>
                <Text style={styles.configValue}>{storedConfig.fc.projectId}</Text>
              </View>
              <View style={styles.configCard}>
                <Text style={styles.configLabel}>Database URL</Text>
                <Text style={styles.configValue}>{storedConfig.fc.databaseURL}</Text>
              </View>
              <View style={styles.configCard}>
                <Text style={styles.configLabel}>Admin Email</Text>
                <Text style={styles.configValue}>{storedConfig.email}</Text>
              </View>
              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 6, backgroundColor: "rgba(239,68,68,0.1)" }]}
                onPress={handleResetConfig}
              >
                <Text style={[styles.primaryBtnText, { color: THEMES[theme].danger }]}>
                  Reset Firebase Config
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Collections</Text>
              <View>
                {collections.map((name, index) => (
                  <View
                    key={name}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: THEMES[theme].bgSecondary,
                      padding: 10,
                      borderRadius: 8,
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ color: THEMES[theme].textPrimary, fontSize: 12 }}>
                      {name}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {index > 0 && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: "rgba(16,185,129,0.2)" }]}
                          onPress={() => handleMoveCollection(name, "up")}
                        >
                          <MaterialCommunityIcons name="chevron-up" size={16} color={THEMES[theme].success} />
                        </TouchableOpacity>
                      )}
                      {index < collections.length - 1 && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: "rgba(245,158,11,0.2)" }]}
                          onPress={() => handleMoveCollection(name, "down")}
                        >
                          <MaterialCommunityIcons name="chevron-down" size={16} color="#f59e0b" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.editBtn]}
                        onPress={() => {
                          setEditingCollection(name);
                          setCollectionNameInput(name);
                          setCollectionModalVisible(true);
                        }}
                      >
                        <MaterialCommunityIcons name="pencil" size={16} color="#3498db" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.deleteBtn]}
                        onPress={() => handleDeleteCollection(name)}
                      >
                        <MaterialCommunityIcons name="trash-can" size={16} color={THEMES[theme].danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="New collection name"
                  placeholderTextColor={THEMES[theme].textSecondary}
                  value={newCollectionName}
                  onChangeText={setNewCollectionName}
                />
                <TouchableOpacity style={[styles.primaryBtn, { paddingHorizontal: 16 }]} onPress={handleAddCollection}>
                  <Text style={styles.primaryBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Theme</Text>
              <View style={styles.themeGrid}>
                {([
                  { key: "cream", label: "Cream", colors: ["#c4956a", "#a67c52"] },
                  { key: "gold", label: "Gold", colors: ["#ffc107", "#ff9800"] },
                  { key: "cyber", label: "Cyber", colors: ["#00f5ff", "#0080ff"] },
                  { key: "firebase", label: "Firebase", colors: ["#FF6D00", "#DD2C00"] },
                ]).map((option) => (
                  <Pressable
                    key={option.key}
                    style={[
                      styles.themeOption,
                      {
                        backgroundColor: option.colors[0],
                      },
                      theme === option.key && styles.themeOptionActive,
                    ]}
                    onPress={() => handleThemeChange(option.key)}
                  >
                    <Text style={{ color: "white", fontWeight: "700", fontSize: 11 }}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      {showTop && (
        <Pressable
          style={styles.topBtn}
          onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
        >
          <MaterialCommunityIcons
            name="chevron-up"
            size={18}
            color={THEMES[theme].accent}
          />
        </Pressable>
      )}

      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem} onPress={() => setActiveTab("devices")}>
          <MaterialCommunityIcons
            name="key-outline"
            size={20}
            color={activeTab === "devices" ? THEMES[theme].accent : THEMES[theme].textSecondary}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "devices" && styles.navLabelActive,
            ]}
          >
            Devices
          </Text>
        </Pressable>
        <Pressable style={styles.fab} onPress={() => openKeyModal()}>
          <MaterialCommunityIcons name="plus" size={22} color="white" />
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => setActiveTab("settings")}>
          <MaterialCommunityIcons
            name="cog"
            size={20}
            color={activeTab === "settings" ? THEMES[theme].accent : THEMES[theme].textSecondary}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "settings" && styles.navLabelActive,
            ]}
          >
            Settings
          </Text>
        </Pressable>
      </View>

      <Modal visible={keyModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>
                  {currentUpdateId ? "Update License Key" : "Add License Key"}
                </Text>
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.inputLabel}>Device ID</Text>
                  <TextInput
                    style={styles.input}
                    value={keyForm.deviceId}
                    onChangeText={(value) =>
                      setKeyForm((prev) => ({ ...prev, deviceId: value }))
                    }
                  />
                </View>
                {duplicateDevice && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>Device ID already exists.</Text>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { paddingVertical: 6 }]}
                      onPress={() => {
                        closeKeyModal();
                        scrollToDevice(duplicateDevice.device_id || duplicateDevice.id || "");
                      }}
                    >
                      <Text style={styles.primaryBtnText}>Locate</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.inputLabel}>License Key</Text>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={keyForm.key}
                      onChangeText={(value) =>
                        setKeyForm((prev) => ({ ...prev, key: value }))
                      }
                    />
                    <TouchableOpacity
                      style={[styles.primaryBtn, { paddingHorizontal: 12 }]}
                      onPress={handleGenerateKey}
                    >
                      <MaterialCommunityIcons name="refresh" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                  {duplicateKey && (
                    <View style={styles.warningBox}>
                      <Text style={styles.warningText}>Duplicate key detected.</Text>
                    </View>
                  )}
                </View>
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="dd-mm-yyyy"
                      placeholderTextColor={THEMES[theme].textSecondary}
                      value={keyForm.expiry}
                      onChangeText={(value) =>
                        setKeyForm((prev) => ({ ...prev, expiry: value }))
                      }
                    />
                    {[7, 15, 30].map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[styles.primaryBtn, { paddingHorizontal: 10, backgroundColor: THEMES[theme].accent }]}
                        onPress={() => handleQuickDate(day)}
                      >
                        <Text style={styles.primaryBtnText}>{day}d</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={{ flexDirection: "row", gap: 6, marginTop: 8, alignItems: "center" }}>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { paddingHorizontal: 12 }]}
                      onPress={() => handleAdjustDate(-1)}
                    >
                      <Text style={styles.primaryBtnText}>-1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { paddingHorizontal: 12 }]}
                      onPress={() => handleAdjustDate(1)}
                    >
                      <Text style={styles.primaryBtnText}>+1</Text>
                    </TouchableOpacity>
                    <Pressable
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderWidth: 1,
                        borderColor: THEMES[theme].border,
                        borderRadius: 8,
                        flex: 1,
                      }}
                      onPress={() =>
                        setKeyForm((prev) => ({
                          ...prev,
                          allowOffline: !prev.allowOffline,
                        }))
                      }
                    >
                      <MaterialCommunityIcons
                        name={
                          keyForm.allowOffline
                            ? "checkbox-marked"
                            : "checkbox-blank-outline"
                        }
                        size={16}
                        color={THEMES[theme].accent}
                      />
                      <Text style={{ fontSize: 11, color: THEMES[theme].textSecondary }}>
                        Allow Offline
                      </Text>
                    </Pressable>
                  </View>
                </View>
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.inputLabel}>User Name</Text>
                  <TextInput
                    style={styles.input}
                    value={keyForm.user}
                    onChangeText={handleUsernameInput}
                  />
                  {userSuggestions.length > 0 && (
                    <View style={styles.suggestionBox}>
                      {userSuggestions.map((name) => (
                        <Pressable
                          key={name}
                          style={styles.suggestionItem}
                          onPress={() => {
                            setKeyForm((prev) => ({ ...prev, user: name }));
                            setUserSuggestions([]);
                          }}
                        >
                          <Text style={styles.suggestionText}>{name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.inputLabel}>Position</Text>
                  <TextInput
                    style={styles.input}
                    value={keyForm.position}
                    onChangeText={handlePositionInput}
                    placeholder="Insert position or search username"
                    placeholderTextColor={THEMES[theme].textSecondary}
                  />
                  {positionSuggestions.length > 0 && (
                    <View style={styles.suggestionBox}>
                      {positionSuggestions.map((item) => (
                        <Pressable
                          key={`${item.position}-${item.user}`}
                          style={styles.suggestionItem}
                          onPress={() => {
                            setKeyForm((prev) => ({
                              ...prev,
                              position: String(item.position),
                            }));
                            setPositionSuggestions([]);
                          }}
                        >
                          <Text style={styles.suggestionText}>
                            #{item.position} - {item.user}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 10, color: THEMES[theme].textSecondary, marginBottom: 10 }}>
                  Total: {allData.length} keys
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleSaveKey}>
                    <Text style={styles.primaryBtnText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { flex: 1, backgroundColor: THEMES[theme].bgSecondary }]}
                    onPress={closeKeyModal}
                  >
                    <Text style={[styles.primaryBtnText, { color: THEMES[theme].textSecondary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={successModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {successModal.isUpdate ? "Key Updated" : "Key Added"}
            </Text>
            {successModal.entry && (
              <View style={{ marginBottom: 12 }}>
                <View style={styles.deviceCard}>
                  <View style={styles.positionTag}>
                    <Text style={styles.positionText}>#{successModal.position}</Text>
                  </View>
                  <Text style={styles.deviceId}>
                    {successModal.entry.device_id}
                  </Text>
                  <Text style={styles.userNameCard}>{successModal.entry.user}</Text>
                  <Pressable onPress={() => handleCopy(successModal.entry?.key)}>
                    <Text style={styles.keyValue}>{successModal.entry.key}</Text>
                  </Pressable>
                  <View style={styles.metaRow}>
                    <Text style={styles.expiryText}>{successModal.entry.expirydate}</Text>
                    <Text
                      style={[
                        styles.statusBadge,
                        successModal.entry.Allowoffline
                          ? styles.badgeOffline
                          : styles.badgeOnline,
                      ]}
                    >
                      {successModal.entry.Allowoffline ? "OFFLINE" : "ONLINE"}
                    </Text>
                  </View>
                  <View style={[styles.toggleRow, { justifyContent: "flex-end" }]}
                  >
                    <Pressable
                      style={[
                        styles.toggleSwitch,
                        previewFullYear && styles.toggleSwitchActive,
                      ]}
                      onPress={() =>
                        successModal.entry?.device_id &&
                        handleToggleYear(
                          successModal.entry.device_id,
                          !previewFullYear
                        )
                      }
                    >
                      <View
                        style={[
                          styles.toggleKnob,
                          previewFullYear && styles.toggleKnobActive,
                        ]}
                      />
                    </Pressable>
                    <Text style={{ fontSize: 10, color: THEMES[theme].textSecondary }}>
                      Year Format
                    </Text>
                  </View>
                </View>
              </View>
            )}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1, backgroundColor: "#3498db" }]}
                onPress={() => {
                  if (successModal.entry) {
                    setSuccessModal({ ...successModal, visible: false });
                    openKeyModal(successModal.entry);
                  }
                }}
              >
                <Text style={styles.primaryBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1, backgroundColor: THEMES[theme].danger }]}
                onPress={async () => {
                  if (!successModal.entry) return;
                  const ok = await confirmAction("Delete Key", "Delete this key?");
                  if (ok) {
                    await handleDeleteKey(successModal.entry.device_id || "");
                    setSuccessModal({ ...successModal, visible: false });
                  }
                }}
              >
                <Text style={styles.primaryBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: THEMES[theme].success }]}
              onPress={() => {
                setSuccessModal({ ...successModal, visible: false });
                if (successModal.entry?.device_id) {
                  scrollToDevice(successModal.entry.device_id);
                }
              }}
            >
              <Text style={styles.primaryBtnText}>OK - Go to Card</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={collectionModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Collection</Text>
            <TextInput
              style={styles.input}
              value={collectionNameInput}
              onChangeText={setCollectionNameInput}
            />
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleRenameCollection}>
                <Text style={styles.primaryBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1, backgroundColor: THEMES[theme].bgSecondary }]}
                onPress={() => setCollectionModalVisible(false)}
              >
                <Text style={[styles.primaryBtnText, { color: THEMES[theme].textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={confirmState.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{confirmState.title}</Text>
            <Text style={{ fontSize: 12, color: THEMES[theme].textPrimary, marginBottom: 14 }}>
              {confirmState.message}
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1, backgroundColor: THEMES[theme].danger }]}
                onPress={() => handleConfirm(true)}
              >
                <Text style={styles.primaryBtnText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1, backgroundColor: THEMES[theme].bgSecondary }]}
                onPress={() => handleConfirm(false)}
              >
                <Text style={[styles.primaryBtnText, { color: THEMES[theme].textSecondary }]}>
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {toastVisible && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
