"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";

type NavigationState = {
  webseriesPage: number;
  categoryPage: {
    [slug: string]: number; // Store page number for each category by slug
  };
  providerPage: number;
  // We can add more page tracking here later for other sections
};

type NavigationContextType = {
  navigationState: NavigationState;
  setWebseriesPage: (page: number) => void;
  setCategoryPage: (slug: string, page: number) => void;
  setProviderPage: (page: number) => void;
  // Add more setters for other sections when needed
};

const initialState: NavigationState = {
  webseriesPage: 1,
  categoryPage: {},
  providerPage: 1,
};

const NavigationContext = createContext<NavigationContextType>({
  navigationState: initialState,
  setWebseriesPage: () => {},
  setCategoryPage: () => {},
  setProviderPage: () => {},
});

export const useNavigation = () => useContext(NavigationContext);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with data from localStorage if available
  const [navigationState, setNavigationState] = useState<NavigationState>(() => {
    // Only run in browser
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("navigationState");
      return savedState ? JSON.parse(savedState) : initialState;
    }
    return initialState;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("navigationState", JSON.stringify(navigationState));
    }
  }, [navigationState]);

  const setWebseriesPage = useCallback((page: number) => {
    setNavigationState((prev) => ({
      ...prev,
      webseriesPage: page,
    }));
  }, []);

  const setCategoryPage = useCallback((slug: string, page: number) => {
    setNavigationState((prev) => ({
      ...prev,
      categoryPage: {
        ...prev.categoryPage,
        [slug]: page,
      },
    }));
  }, []);

  const setProviderPage = useCallback((page: number) => {
    setNavigationState((prev) => {
      // Only update if the page actually changed
      if (prev.providerPage === page) {
        return prev;
      }
      return {
        ...prev,
        providerPage: page,
      };
    });
  }, []);

  const value = useMemo(() => ({
    navigationState,
    setWebseriesPage,
    setCategoryPage,
    setProviderPage,
    // Add more setters as needed
  }), [navigationState, setWebseriesPage, setCategoryPage, setProviderPage]);

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}; 