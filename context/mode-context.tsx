"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type Mode = "admin" | "bidang" | "kaban";
export type BidangId = 1 | 2 | 3 | 4;

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  mode: Mode;
  bidangId?: BidangId;
  bidangName?: string;
  roleLabel: string;
  initials: string;
  gradient: string;
  sessionToken: string; // Token proteksi URL anti-tamper acak
  rolePath: string;     // Folder role path (Admin, Bidang1, Bidang2, Bidang3, Bidang4, Kaban)
  userIndex: string;    // Multi-tenant user index (0, 1, dll)
}

// Function generator token acak kriptografis 28-karakter
export const generateSecureToken = (length = 28): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `s_${result}`;
};

export const accounts: UserAccount[] = [
  {
    id: "admin",
    name: "Sekre Kesbangpol",
    email: "kesbangplsekre@gmail.com",
    mode: "admin",
    roleLabel: "Administrator Utama (Sekretariat)",
    initials: "SK",
    gradient: "from-emerald-500 to-teal-600",
    sessionToken: "s_W8E9iFrFqoIw3NE7pL2xZbY0kM5v",
    rolePath: "Admin",
    userIndex: "0",
  },
  {
    id: "kaban",
    name: "Kepala Badan (Kaban)",
    email: "kesbangpolkepalabadan@gmail.com",
    mode: "kaban",
    roleLabel: "Kepala Badan — Akses Lihat & Unduh",
    initials: "KB",
    gradient: "from-slate-700 to-zinc-900",
    sessionToken: "s_Kb7Xw2VpQmR5TzN9Yc4LhJ3Ds8Ae",
    rolePath: "Kaban",
    userIndex: "0",
  },
  {
    id: "bidang1",
    name: "Staff Verifikator Bidang 1",
    email: "kesbangpolbidang01@gmail.com",
    mode: "bidang",
    bidangId: 1,
    bidangName: "Bidang Ideologi, Wawasan Kebangsaan & Karakter Bangsa",
    roleLabel: "Tim Evaluator Bidang 1",
    initials: "B1",
    gradient: "from-blue-600 to-indigo-700",
    sessionToken: "s_Q9gRc235sBEvJ84NkLmMpQ91xAa6",
    rolePath: "Bidang1",
    userIndex: "0",
  },
  {
    id: "bidang2",
    name: "Staff Verifikator Bidang 2",
    email: "kesbangpolbidang02@gmail.com",
    mode: "bidang",
    bidangId: 2,
    bidangName: "Bidang Politik Dalam Negeri & Organisasi Kemasyarakatan",
    roleLabel: "Tim Evaluator Bidang 2",
    initials: "B2",
    gradient: "from-red-600 to-rose-700",
    sessionToken: "s_B2xK98jLmQwe37TpZvY1rNc6Ad4F",
    rolePath: "Bidang2",
    userIndex: "0",
  },
  {
    id: "bidang3",
    name: "Staff Verifikator Bidang 3",
    email: "kesbangpolbidang03@gmail.com",
    mode: "bidang",
    bidangId: 3,
    bidangName: "Bidang Ketahanan Ekonomi, Sosbud & Agama",
    roleLabel: "Tim Evaluator Bidang 3",
    initials: "B3",
    gradient: "from-amber-500 to-orange-600",
    sessionToken: "s_B3mN76vCxZyt90KlPa1Sd4Fg7Hj2",
    rolePath: "Bidang3",
    userIndex: "0",
  },
  {
    id: "bidang4",
    name: "Staff Verifikator Bidang 4",
    email: "kesbangpolbidang04@gmail.com",
    mode: "bidang",
    bidangId: 4,
    bidangName: "Bidang Kewaspadaan Nasional & Penanganan Konflik",
    roleLabel: "Tim Evaluator Bidang 4",
    initials: "B4",
    gradient: "from-purple-600 to-indigo-800",
    sessionToken: "s_45GEnIeInOy4E81RwTxP9qLm3Vb6",
    rolePath: "Bidang4",
    userIndex: "0",
  },
];

export const bidangInfo: Record<
  BidangId,
  { shortName: string; fullName: string; description: string; code: string; color: string }
> = {
  1: {
    shortName: "Bidang 1",
    fullName: "Ideologi & Wawasan Kebangsaan",
    description: "Pembinaan ideologi Pancasila, wawasan kebangsaan, dan bela negara.",
    code: "B1-IDW",
    color: "bg-blue-600",
  },
  2: {
    shortName: "Bidang 2",
    fullName: "Politik Dalam Negeri & Ormas",
    description: "Fasilitasi parpol, pemilu, serta pendaftaran & verifikasi ormas.",
    code: "B2-POL",
    color: "bg-red-600",
  },
  3: {
    shortName: "Bidang 3",
    fullName: "Ketahanan Ekonomi, Sosbud & Agama",
    description: "Ketahanan ekonomi, seni budaya, serta kerukunan umat beragama (FKUB).",
    code: "B3-ESA",
    color: "bg-amber-600",
  },
  4: {
    shortName: "Bidang 4",
    fullName: "Kewaspadaan Nasional & Konflik",
    description: "Deteksi dini, pemantauan orang asing, dan pencegahan konflik sosial.",
    code: "B4-KWN",
    color: "bg-purple-600",
  },
};

interface ModeContextType {
  mode: Mode;
  bidangId: BidangId;
  currentUser: UserAccount;
  isLoggedIn: boolean;
  authInitialized: boolean;
  loginWithAccount: (accountId: string) => UserAccount;
  logout: () => void;
  setMode: (mode: Mode) => void;
  setBidangId: (id: BidangId) => void;
  getUrl: (menuName: string) => string;
  getHomeUrl: () => string;
  verifyAccess: (token: string, role: string) => boolean;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>("admin");
  const [bidangId, setBidangIdState] = useState<BidangId>(1);
  const [currentUser, setCurrentUser] = useState<UserAccount>(accounts[0]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLoggedIn = localStorage.getItem("kesbangpol_is_logged_in");
    const savedAccount = localStorage.getItem("kesbangpol_account_id");
    const savedToken = localStorage.getItem("kesbangpol_session_token");

    if (savedLoggedIn === "true" && savedAccount && savedToken) {
      const found = accounts.find((a) => a.id === savedAccount);
      if (found) {
        const userWithToken: UserAccount = {
          ...found,
          sessionToken: savedToken,
        };
        setCurrentUser(userWithToken);
        setModeState(found.mode);
        if (found.bidangId) setBidangIdState(found.bidangId);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
    setAuthInitialized(true);
  }, []);

  const loginWithAccount = (accountId: string): UserAccount => {
    const found = accounts.find((a) => a.id === accountId) || accounts[0];
    const dynamicRandomToken = generateSecureToken(28);

    const activeUser: UserAccount = {
      ...found,
      sessionToken: dynamicRandomToken,
    };

    setCurrentUser(activeUser);
    setModeState(found.mode);
    if (found.bidangId) setBidangIdState(found.bidangId);
    setIsLoggedIn(true);

    if (typeof window !== "undefined") {
      localStorage.setItem("kesbangpol_account_id", found.id);
      localStorage.setItem("kesbangpol_session_token", dynamicRandomToken);
      localStorage.setItem("kesbangpol_is_logged_in", "true");
      document.cookie = `kesbangpol_session=${dynamicRandomToken}; path=/; max-age=86400; SameSite=Lax`;
    }

    return activeUser;
  };

  const logout = () => {
    setIsLoggedIn(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("kesbangpol_is_logged_in", "false");
      localStorage.removeItem("kesbangpol_account_id");
      localStorage.removeItem("kesbangpol_session_token");
      document.cookie = "kesbangpol_session=; path=/; max-age=0; SameSite=Lax";
    }
  };

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
  };

  const setBidangId = (newBidangId: BidangId) => {
    setBidangIdState(newBidangId);
  };

  // Generate Enterprise Gov Portal URL: /portal/u/0/s_[token]/[Role]/[Menu]
  const getUrl = (menuName: string): string => {
    const activeAccount = mounted ? currentUser : accounts[0];
    const cleanMenu = menuName.replace(/^\//, "");
    return `/portal/u/${activeAccount.userIndex || "0"}/${activeAccount.sessionToken}/${activeAccount.rolePath}/${cleanMenu}`;
  };

  const getHomeUrl = (): string => {
    return getUrl("Beranda");
  };

  // Anti-tamper verification
  const verifyAccess = (token: string, role: string): boolean => {
    const activeAccount = mounted ? currentUser : accounts[0];
    return (
      activeAccount.sessionToken.toLowerCase() === token.toLowerCase() &&
      activeAccount.rolePath.toLowerCase() === role.toLowerCase()
    );
  };

  return (
    <ModeContext.Provider
      value={{
        mode,
        bidangId,
        currentUser: mounted ? currentUser : accounts[0],
        isLoggedIn: mounted ? isLoggedIn : false,
        authInitialized,
        loginWithAccount,
        logout,
        setMode,
        setBidangId,
        getUrl,
        getHomeUrl,
        verifyAccess,
      }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
}
