"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  Search,
  MapPin,
  ArrowUpDown,
  Check,
  X,
  Menu,
  ChevronRight,
  Clock,
  Video,
  Building,
  Sparkles,
  Wallet,
  Star,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface Doctor {
  id: string
  name: string
  name_initials: string
  photo: string
  doctor_introduction: string
  specialities: { name: string }[]
  fees: string
  experience: string
  languages: string[]
  clinic: {
    name: string
    address: {
      locality: string
      city: string
      address_line1: string
      location: string
      logo_url: string
    }
  }
  video_consult: boolean
  in_clinic: boolean
}

interface FilterState {
  query: string
  consultType: string
  specialties: string[]
  sort: string
}

export default function DoctorListing() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([])
  const [allSpecialties, setAllSpecialties] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<Doctor[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Combine all filter states into a single state object
  const [filters, setFilters] = useState<FilterState>({
    query: "",
    consultType: "",
    specialties: [],
    sort: "",
  })

  // Flag to prevent URL updates during initial load
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  // Fetch doctors data
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch("https://srijandubey.github.io/campus-api-mock/SRM-C1-25.json")
        const data = await response.json()
        setDoctors(data)
        setFilteredDoctors(data)

        // Extract all unique specialties
        const specialties = new Set<string>()
        data.forEach((doctor: Doctor) => {
          doctor.specialities.forEach((specialty) => {
            specialties.add(specialty.name)
          })
        })
        setAllSpecialties(Array.from(specialties).sort())

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching doctors:", error)
        setIsLoading(false)
      }
    }

    fetchDoctors()
  }, [])

  // Load initial filters from URL params
  useEffect(() => {
    if (doctors.length > 0 && !initialLoadComplete) {
      const query = searchParams.get("query") || ""
      const consultType = searchParams.get("consult") || ""
      const specialties = searchParams.getAll("specialty") || []
      const sort = searchParams.get("sort") || ""

      // Set filters from URL params
      setFilters({
        query,
        consultType,
        specialties,
        sort,
      })

      setInitialLoadComplete(true)
    }
  }, [doctors, searchParams, initialLoadComplete])

  // Apply filters whenever filters state changes
  const applyFilters = useCallback(() => {
    if (doctors.length === 0) return

    let filtered = [...doctors]

    // Apply search filter
    if (filters.query) {
      filtered = filtered.filter((doctor) => doctor.name.toLowerCase().includes(filters.query.toLowerCase()))
    }

    // Apply consultation type filter
    if (filters.consultType) {
      filtered = filtered.filter((doctor) => {
        if (filters.consultType === "video") return doctor.video_consult
        if (filters.consultType === "clinic") return doctor.in_clinic
        return true
      })
    }

    // Apply specialty filters
    if (filters.specialties.length > 0) {
      filtered = filtered.filter((doctor) =>
        doctor.specialities.some((spec) => filters.specialties.includes(spec.name)),
      )
    }

    // Apply sorting
    if (filters.sort) {
      if (filters.sort === "fees") {
        filtered.sort((a, b) => {
          const aFees = Number.parseInt(a.fees.replace(/[^\d]/g, ""))
          const bFees = Number.parseInt(b.fees.replace(/[^\d]/g, ""))
          return aFees - bFees
        })
      } else if (filters.sort === "experience") {
        filtered.sort((a, b) => {
          const aExp = Number.parseInt(a.experience.match(/\d+/)?.[0] || "0")
          const bExp = Number.parseInt(b.experience.match(/\d+/)?.[0] || "0")
          return bExp - aExp // Descending order for experience
        })
      }
    }

    setFilteredDoctors(filtered)
  }, [doctors, filters])

  // Apply filters when filters change
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // Update URL when filters change (but only after initial load)
  useEffect(() => {
    if (!initialLoadComplete) return

    const params = new URLSearchParams()

    if (filters.query) params.set("query", filters.query)
    if (filters.consultType) params.set("consult", filters.consultType)
    filters.specialties.forEach((specialty) => params.append("specialty", specialty))
    if (filters.sort) params.set("sort", filters.sort)

    // Use replace instead of push to avoid adding to history stack
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [filters, initialLoadComplete, router])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value

    // Update search suggestions
    if (query.trim()) {
      const suggestions = doctors
        .filter((doctor) => doctor.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3) // Show top 3 matches

      setSearchSuggestions(suggestions)
      setShowSuggestions(suggestions.length > 0)
    } else {
      setSearchSuggestions([])
      setShowSuggestions(false)
    }

    // Just update the query in the input, don't apply filters yet
    setFilters((prev) => ({ ...prev, query }))
  }

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)
    // Filters are automatically applied via useEffect
  }

  // Handle suggestion click
  const handleSuggestionClick = (name: string) => {
    setFilters((prev) => ({ ...prev, query: name }))
    setShowSuggestions(false)
  }

  // Get placeholder image for doctors without photos
  const getPlaceholderImage = (name: string) => {
    return `/placeholder.svg?height=100&width=100&query=doctor ${name}`
  }

  // Get years from experience string
  const getYearsOfExperience = (experience: string) => {
    const match = experience.match(/\d+/)
    return match ? match[0] : "0"
  }

  // Count active filters
  const activeFilterCount = (filters.consultType ? 1 : 0) + filters.specialties.length + (filters.sort ? 1 : 0)

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      query: "",
      consultType: "",
      specialties: [],
      sort: "",
    })
  }

  // Format price
  const formatPrice = (price: string) => {
    const numericPrice = price.replace(/[^\d]/g, "")
    return `₹${numericPrice}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9F5FF]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
          <p className="text-purple-900">Loading doctors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F5FF]">
      {/* Header */}
      <header className="bg-white border-b border-purple-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
                HealthHub
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-purple-700 hidden md:flex">
                For Patients
              </Button>
              <Button variant="ghost" size="sm" className="text-purple-700 hidden md:flex">
                For Doctors
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-purple-200 text-purple-700 hover:bg-purple-50 hidden md:flex"
              >
                Sign In
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="flex flex-col gap-4 mt-8">
                    <Button variant="ghost" className="justify-start">
                      For Patients
                    </Button>
                    <Button variant="ghost" className="justify-start">
                      For Doctors
                    </Button>
                    <Button variant="ghost" className="justify-start">
                      Sign In
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-purple-600 mb-6">
          <span>Home</span>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span>Find Doctors</span>
          {filters.specialties.length > 0 && (
            <>
              <ChevronRight className="h-4 w-4 mx-1" />
              <span>{filters.specialties[0]}</span>
            </>
          )}
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-900 mb-2">Find & Book Appointments</h1>
          <p className="text-purple-600">Discover the best doctors, clinics, and hospitals near you.</p>
        </div>

        {/* Search and Filters Row */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search Bar */}
          <div className="w-full md:w-1/2">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-purple-400" />
              </div>
              <Input
                type="text"
                placeholder="Search doctors by name"
                value={filters.query}
                onChange={handleSearchChange}
                className="pl-10 py-6 border-purple-200 focus-visible:ring-purple-500"
                data-testid="autocomplete-input"
              />

              {/* Search Suggestions */}
              {showSuggestions && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-purple-100 rounded-md shadow-lg">
                  {searchSuggestions.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="p-3 hover:bg-purple-50 cursor-pointer border-b last:border-0"
                      onClick={() => handleSuggestionClick(doctor.name)}
                      data-testid="suggestion-item"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={
                              doctor.photo && doctor.photo !== "null" ? doctor.photo : getPlaceholderImage(doctor.name)
                            }
                            alt={doctor.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-purple-900">{doctor.name}</p>
                          <p className="text-sm text-purple-600">{doctor.specialities.map((s) => s.name).join(", ")}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* Filter and Sort Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className={`border-purple-200 ${
                showFilters ? "bg-purple-100 text-purple-900" : "text-purple-700 hover:bg-purple-50"
              } flex-1`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <span className="flex items-center">
                <span className="mr-2">Filters</span>
                {activeFilterCount > 0 && (
                  <Badge className="bg-purple-600 hover:bg-purple-700">{activeFilterCount}</Badge>
                )}
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={`border-purple-200 ${
                    filters.sort ? "bg-purple-100 text-purple-900" : "text-purple-700 hover:bg-purple-50"
                  } flex-1`}
                >
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <span>
                    {filters.sort === "fees"
                      ? "Price: Low to High"
                      : filters.sort === "experience"
                        ? "Experience: High to Low"
                        : "Sort"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem
                  onClick={() => setFilters((prev) => ({ ...prev, sort: "fees" }))}
                  className="cursor-pointer"
                  data-testid="sort-fees"
                >
                  <span className="flex items-center w-full">
                    Price: Low to High
                    {filters.sort === "fees" && <Check className="ml-auto h-4 w-4" />}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilters((prev) => ({ ...prev, sort: "experience" }))}
                  className="cursor-pointer"
                  data-testid="sort-experience"
                >
                  <span className="flex items-center w-full">
                    Experience: High to Low
                    {filters.sort === "experience" && <Check className="ml-auto h-4 w-4" />}
                  </span>
                </DropdownMenuItem>
                {filters.sort && (
                  <DropdownMenuItem
                    onClick={() => setFilters((prev) => ({ ...prev, sort: "" }))}
                    className="cursor-pointer text-purple-600"
                  >
                    <span className="flex items-center w-full">
                      Clear Sort
                      <X className="ml-auto h-4 w-4" />
                    </span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.consultType && (
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 px-3 py-1.5"
              >
                {filters.consultType === "video" ? "Video Consult" : "In Clinic"}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => setFilters((prev) => ({ ...prev, consultType: "" }))}
                />
              </Badge>
            )}

            {filters.specialties.map((specialty) => (
              <Badge
                key={specialty}
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 px-3 py-1.5"
              >
                {specialty}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      specialties: prev.specialties.filter((s) => s !== specialty),
                    }))
                  }
                />
              </Badge>
            ))}

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 text-sm h-8"
                onClick={clearAllFilters}
              >
                Clear All
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Panel */}
          {showFilters && (
            <div className="w-full lg:w-1/4 bg-white rounded-xl shadow-sm p-5 h-fit">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-purple-900">Filters</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 text-sm h-8 lg:hidden"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Accordion type="single" collapsible defaultValue="consultation" className="w-full">
                {/* Consultation Mode */}
                <AccordionItem value="consultation" className="border-b border-purple-100">
                  <AccordionTrigger
                    className="text-sm font-medium text-purple-900 py-3 hover:no-underline"
                    data-testid="filter-header-moc"
                  >
                    Consultation Mode
                  </AccordionTrigger>
                  <AccordionContent>
                    <RadioGroup
                      value={filters.consultType}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, consultType: value }))}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="video"
                          id="video"
                          className="text-purple-600"
                          data-testid="filter-video-consult"
                        />
                        <Label htmlFor="video" className="text-sm text-purple-700 cursor-pointer">
                          Video Consult
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="clinic"
                          id="clinic"
                          className="text-purple-600"
                          data-testid="filter-in-clinic"
                        />
                        <Label htmlFor="clinic" className="text-sm text-purple-700 cursor-pointer">
                          In Clinic
                        </Label>
                      </div>
                    </RadioGroup>
                  </AccordionContent>
                </AccordionItem>

                {/* Specialties */}
                <AccordionItem value="specialties" className="border-b border-purple-100">
                  <AccordionTrigger
                    className="text-sm font-medium text-purple-900 py-3 hover:no-underline"
                    data-testid="filter-header-speciality"
                  >
                    Speciality
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {allSpecialties.map((specialty) => (
                        <div key={specialty} className="flex items-center space-x-2">
                          <Checkbox
                            id={`specialty-${specialty}`}
                            checked={filters.specialties.includes(specialty)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilters((prev) => ({
                                  ...prev,
                                  specialties: [...prev.specialties, specialty],
                                }))
                              } else {
                                setFilters((prev) => ({
                                  ...prev,
                                  specialties: prev.specialties.filter((s) => s !== specialty),
                                }))
                              }
                            }}
                            className="text-purple-600 border-purple-300"
                            data-testid={`filter-specialty-${specialty.replace(/[/\s]/g, "-")}`}
                          />
                          <Label htmlFor={`specialty-${specialty}`} className="text-sm text-purple-700 cursor-pointer">
                            {specialty}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Sort */}
                <AccordionItem value="sort" className="border-b-0">
                  <AccordionTrigger
                    className="text-sm font-medium text-purple-900 py-3 hover:no-underline"
                    data-testid="filter-header-sort"
                  >
                    Sort By
                  </AccordionTrigger>
                  <AccordionContent>
                    <RadioGroup
                      value={filters.sort}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, sort: value }))}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fees" id="fees" className="text-purple-600" data-testid="sort-fees" />
                        <Label htmlFor="fees" className="text-sm text-purple-700 cursor-pointer">
                          Fees (Low to High)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="experience"
                          id="experience"
                          className="text-purple-600"
                          data-testid="sort-experience"
                        />
                        <Label htmlFor="experience" className="text-sm text-purple-700 cursor-pointer">
                          Experience (High to Low)
                        </Label>
                      </div>
                    </RadioGroup>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* Doctor List */}
          <div className={`w-full ${showFilters ? "lg:w-3/4" : "lg:w-full"}`}>
            <div className="mb-4">
              <p className="text-purple-700">
                {filteredDoctors.length} {filteredDoctors.length === 1 ? "doctor" : "doctors"} available
              </p>
            </div>

            {filteredDoctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow border border-purple-100"
                    data-testid="doctor-card"
                  >
                    {/* Doctor Header */}
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white relative">
                      <div className="flex items-start gap-4">
                        <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-white">
                          <Image
                            src={
                              doctor.photo && doctor.photo !== "null" ? doctor.photo : getPlaceholderImage(doctor.name)
                            }
                            alt={doctor.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold" data-testid="doctor-name">
                            {doctor.name}
                          </h3>
                          <p className="text-sm text-purple-100" data-testid="doctor-specialty">
                            {doctor.specialities.map((s) => s.name).join(", ")}
                          </p>
                          <div className="flex items-center mt-1">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${star <= 4 ? "fill-yellow-400 text-yellow-400" : "text-purple-200"}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs ml-1 text-purple-100">(87)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Doctor Details */}
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-purple-600">Experience</p>
                            <p className="text-sm font-medium text-purple-900" data-testid="doctor-experience">
                              {getYearsOfExperience(doctor.experience)} Years
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-purple-600">Fee</p>
                            <p className="text-sm font-medium text-purple-900" data-testid="doctor-fee">
                              {formatPrice(doctor.fees)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Clinic Info */}
                      <div className="flex items-start gap-2 mb-4">
                        <MapPin className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-purple-700 line-clamp-2">
                          {doctor.clinic.name}, {doctor.clinic.address.locality}, {doctor.clinic.address.city}
                        </p>
                      </div>

                      {/* Available For */}
                      <div className="flex gap-2 mb-4">
                        {doctor.video_consult && (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-2 py-1 flex items-center gap-1">
                            <Video className="h-3 w-3" />
                            <span className="text-xs">Video</span>
                          </Badge>
                        )}
                        {doctor.in_clinic && (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-2 py-1 flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            <span className="text-xs">In-Clinic</span>
                          </Badge>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button className="bg-purple-600 hover:bg-purple-700 text-sm h-9">Book Now</Button>
                        <Button
                          variant="outline"
                          className="border-purple-200 text-purple-700 hover:bg-purple-50 text-sm h-9"
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="flex flex-col items-center max-w-md mx-auto">
                  <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                    <Search className="h-10 w-10 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-purple-900 mb-2">No doctors found</h3>
                  <p className="text-purple-600 mb-6">
                    We couldn't find any doctors matching your search criteria. Try adjusting your filters or search for
                    a different specialty.
                  </p>
                  <Button
                    variant="outline"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={clearAllFilters}
                  >
                    Clear all filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-purple-900 text-white py-12 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-purple-300" />
                <h3 className="text-white font-bold text-lg">HealthHub</h3>
              </div>
              <p className="text-sm text-purple-300">
                Your trusted platform for finding and booking appointments with top healthcare professionals.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">For Patients</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-purple-300 hover:text-white">
                    Find a Doctor
                  </a>
                </li>
                <li>
                  <a href="#" className="text-purple-300 hover:text-white">
                    Book Appointment
                  </a>
                </li>
                <li>
                  <a href="#" className="text-purple-300 hover:text-white">
                    Health Articles
                  </a>
                </li>
                <li>
                  <a href="#" className="text-purple-300 hover:text-white">
                    User Reviews
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">For Doctors</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-purple-300 hover:text-white">
                    Join as a Doctor
                  </a>
                </li>
                <li>
                  <a href="#" className="text-purple-300 hover:text-white">
                    Doctor Login
                  </a>
                </li>
                <li>
                  <a href="#" className="text-purple-300 hover:text-white">
                    Practice Management
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Contact Us</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-purple-300" />
                  <span className="text-purple-300">123 Health Street, Medical District</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-purple-300" />
                  <span className="text-purple-300">+1 (800) HEALTH-HUB</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-300" />
                  <span className="text-purple-300">Mon-Sat: 9AM - 8PM</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-purple-800 mt-8 pt-8 text-center text-sm text-purple-400">
            <p>© {new Date().getFullYear()} HealthHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
