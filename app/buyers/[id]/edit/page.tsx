"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "../../../contexts/AuthContext"
import Layout from "../../../components/Layout"
import { ErrorBoundary } from "../../../components/ErrorBoundary"
import { buyersApi } from "../../../lib/api"
import { buyerSchema, type Buyer } from "../../../lib/validation"

interface BuyerData extends Buyer {
  id: string
  updated_at: string
}

export default function EditBuyerPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState("")
  const [buyer, setBuyer] = useState<BuyerData | null>(null)

  const { id } = use(params)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<Buyer>({
    resolver: zodResolver(buyerSchema) as any,
  })
  
  const propertyType = watch("propertyType")

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && id) {
      fetchBuyer()
    }
  }, [user, id])

  const fetchBuyer = async () => {
    try {
      setFetchLoading(true)
      setError("")

      const response = await buyersApi.getBuyer(id)
      const buyerData = response.data.buyer
      setBuyer(buyerData)

      // Check if user can edit this buyer
      if (user?.role !== "admin" && user?.id !== buyerData.owner_id) {
        setError("You do not have permission to edit this buyer")
        return
      }

      // Populate form with existing data
      reset({
        fullName: buyerData.full_name,
        email: buyerData.email || "",
        phone: buyerData.phone,
        city: buyerData.city as any,
        propertyType: buyerData.property_type as any,
        bhk: buyerData.bhk as any,
        purpose: buyerData.purpose as any,
        budgetMin: buyerData.budget_min,
        budgetMax: buyerData.budget_max,
        timeline: buyerData.timeline as any,
        source: buyerData.source as any,
        status: buyerData.status as any,
        notes: buyerData.notes || "",
        tags: buyerData.tags || [],
      })
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("Buyer not found")
      } else if (err.response?.status === 403) {
        setError("You do not have permission to edit this buyer")
      } else {
        setError(err.response?.data?.error || "Failed to fetch buyer")
      }
    } finally {
      setFetchLoading(false)
    }
  }

  const onSubmit = async (data: Buyer) => {
    if (!buyer) return

    try {
      setLoading(true)
      setError("")

      // Convert empty strings to undefined for optional fields
      const cleanedData = {
        ...data,
        email: data.email || undefined,
        budgetMin: data.budgetMin || undefined,
        budgetMax: data.budgetMax || undefined,
        notes: data.notes || undefined,
        bhk: data.bhk || undefined,
        updatedAt: buyer.updated_at, // Include for concurrency check
      }

      await buyersApi.updateBuyer(buyer.id, cleanedData)
      router.push(`/buyers/${buyer.id}`)
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError("This record has been modified by another user. Please refresh the page and try again.")
      } else {
        setError(err.response?.data?.error || "Failed to update buyer")
      }
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error && !buyer) {
    return (
      <ErrorBoundary>
        <Layout>
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </Layout>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <Layout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Edit Buyer Lead</h2>
              {buyer && <p className="mt-1 text-sm text-gray-500">Editing: {(buyer as any).full_name}</p>}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8">
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Personal Information</h3>
                  <p className="mt-1 text-sm text-gray-500">Basic contact details of the buyer.</p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6">
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        {...register("fullName")}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                      />
                      {errors.fullName && <p className="mt-2 text-sm text-red-600">{errors.fullName.message}</p>}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        {...register("email")}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                      />
                      {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        {...register("phone")}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                      />
                      {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Property Requirements</h3>
                  <p className="mt-1 text-sm text-gray-500">Details about the property they are looking for.</p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        City *
                      </label>
                      <select
                        id="city"
                        {...register("city")}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Select City</option>
                        <option value="Chandigarh">Chandigarh</option>
                        <option value="Mohali">Mohali</option>
                        <option value="Zirakpur">Zirakpur</option>
                        <option value="Panchkula">Panchkula</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.city && <p className="mt-2 text-sm text-red-600">{errors.city.message}</p>}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">
                        Property Type *
                      </label>
                      <select
                        id="propertyType"
                        {...register("propertyType")}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Select Type</option>
                        <option value="Apartment">Apartment</option>
                        <option value="Villa">Villa</option>
                        <option value="Plot">Plot</option>
                        <option value="Office">Office</option>
                        <option value="Retail">Retail</option>
                      </select>
                      {errors.propertyType && (
                        <p className="mt-2 text-sm text-red-600">{errors.propertyType.message}</p>
                      )}
                    </div>

                    {(propertyType === "Apartment" || propertyType === "Villa") && (
                      <div className="col-span-6 sm:col-span-3">
                        <label htmlFor="bhk" className="block text-sm font-medium text-gray-700">
                          BHK *
                        </label>
                        <select
                          id="bhk"
                          {...register("bhk")}
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="">Select BHK</option>
                          <option value="1">1 BHK</option>
                          <option value="2">2 BHK</option>
                          <option value="3">3 BHK</option>
                          <option value="4">4 BHK</option>
                          <option value="Studio">Studio</option>
                        </select>
                        {errors.bhk && <p className="mt-2 text-sm text-red-600">{errors.bhk.message}</p>}
                      </div>
                    )}

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                        Purpose *
                      </label>
                      <select
                        id="purpose"
                        {...register("purpose")}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Select Purpose</option>
                        <option value="Buy">Buy</option>
                        <option value="Rent">Rent</option>
                      </select>
                      {errors.purpose && <p className="mt-2 text-sm text-red-600">{errors.purpose.message}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Budget & Timeline</h3>
                  <p className="mt-1 text-sm text-gray-500">Budget range and timeline for purchase.</p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="budgetMin" className="block text-sm font-medium text-gray-700">
                        Budget Min (₹)
                      </label>
                      <input
                        type="number"
                        id="budgetMin"
                        {...register("budgetMin", { valueAsNumber: true })}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                      />
                      {errors.budgetMin && <p className="mt-2 text-sm text-red-600">{errors.budgetMin.message}</p>}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="budgetMax" className="block text-sm font-medium text-gray-700">
                        Budget Max (₹)
                      </label>
                      <input
                        type="number"
                        id="budgetMax"
                        {...register("budgetMax", { valueAsNumber: true })}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                      />
                      {errors.budgetMax && <p className="mt-2 text-sm text-red-600">{errors.budgetMax.message}</p>}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="timeline" className="block text-sm font-medium text-gray-700">
                        Timeline *
                      </label>
                      <select
                        id="timeline"
                        {...register("timeline")}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Select Timeline</option>
                        <option value="0-3m">0-3 months</option>
                        <option value="3-6m">3-6 months</option>
                        <option value=">6m">&gt;6 months</option>
                        <option value="Exploring">Exploring</option>
                      </select>
                      {errors.timeline && <p className="mt-2 text-sm text-red-600">{errors.timeline.message}</p>}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                        Source *
                      </label>
                      <select
                        id="source"
                        {...register("source")}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Select Source</option>
                        <option value="Website">Website</option>
                        <option value="Referral">Referral</option>
                        <option value="Walk-in">Walk-in</option>
                        <option value="Call">Call</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.source && <p className="mt-2 text-sm text-red-600">{errors.source.message}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Additional Information</h3>
                  <p className="mt-1 text-sm text-gray-500">Notes and status for better organization.</p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6">
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        rows={4}
                        {...register("notes")}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                        placeholder="Any additional notes about the buyer..."
                      />
                      {errors.notes && <p className="mt-2 text-sm text-red-600">{errors.notes.message}</p>}
                    </div>

                    <div className="col-span-6">
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        id="status"
                        {...register("status")}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="New">New</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Visited">Visited</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Converted">Converted</option>
                        <option value="Dropped">Dropped</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update Buyer Lead"}
              </button>
            </div>
          </form>
        </div>
      </Layout>
    </ErrorBoundary>
  )
}
