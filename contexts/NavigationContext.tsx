"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type NavigationState = {
  webseriesPage: number;
  creatorPage: {
    [slug: string]: number; // Store page number for each creator by slug
  };
  categoryPage: {
    [slug: string]: number; // Store page number for each category by slug
  };
  // We can add more page tracking here later for other sections
};

type NavigationContextType = {
  navigationState: NavigationState;
  setWebseriesPage: (page: number) => void;
  setCreatorPage: (slug: string, page: number) => void;
  setCategoryPage: (slug: string, page: number) => void;
  // Add more setters for other sections when needed
};

const initialState: NavigationState = {
  webseriesPage: 1,
  creatorPage: {},
  categoryPage: {},
};

const NavigationContext = createContext<NavigationContextType>({
  navigationState: initialState,
  setWebseriesPage: () => {},
  setCreatorPage: () => {},
  setCategoryPage: () => {},
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

  const setWebseriesPage = (page: number) => {
    setNavigationState((prev) => ({
      ...prev,
      webseriesPage: page,
    }));
  };

  const setCreatorPage = (slug: string, page: number) => {
    setNavigationState((prev) => ({
      ...prev,
      creatorPage: {
        ...prev.creatorPage,
        [slug]: page,
      },
    }));
  };

  const setCategoryPage = (slug: string, page: number) => {
    setNavigationState((prev) => ({
      ...prev,
      categoryPage: {
        ...prev.categoryPage,
        [slug]: page,
      },
    }));
  };

  const value = {
    navigationState,
    setWebseriesPage,
    setCreatorPage,
    setCategoryPage,
    // Add more setters as needed
  };

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}; 