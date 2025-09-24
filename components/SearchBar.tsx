"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"

interface SearchBarProps {
  fullWidth?: boolean
  initialQuery?: string
}

const SearchBar = ({ fullWidth = false, initialQuery = "" }: SearchBarProps) => {
  const [query, setQuery] = useState(initialQuery)
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const clearSearch = () => {
    setQuery("")
  }

  return (
    <form onSubmit={handleSearch} className={`relative ${fullWidth ? "w-full" : "max-w-md mx-auto"}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Search size={20} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for videos, actors, categories..."
          className="w-full py-3 pl-10 pr-10 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
        {query && (
          <button type="button" onClick={clearSearch} className="absolute inset-y-0 right-0 flex items-center pr-3">
            <X size={20} className="text-gray-400 hover:text-gray-200" />
          </button>
        )}
      </div>
    </form>
  )
}

export default SearchBar
