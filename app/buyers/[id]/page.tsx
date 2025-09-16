"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../../contexts/AuthContext"
import Layout from "../../components/Layout"
import { ErrorBoundary } from "../../components/ErrorBoundary"
import { buyersApi } from "../../lib/api"

interface Buyer {
  id: string
  full_name: string
  phone: string
  email?: string
  city: string
  property_type: string
  bhk?: string
  purpose: string
  budget_min?: number
  budget_max?: number
  timeline: string
  source: string
  status: string
  notes?: string
  tags: string[]
  owner_email: string
  created_at: string
  updated_at: string
}

interface HistoryEntry {
  id: string
  changed_at: string
  changed_by_email: string
  diff: any
}

export default function BuyerDetailPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [buyer, setBuyer] = useState<Buyer | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && params.id) {
      fetchBuyer()
    }
  }, [user, params.id])

  const fetchBuyer = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await buyersApi.getBuyer(params.id)
      setBuyer(response.data.buyer)
      setHistory(response.data.history || [])
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("Buyer not found")
      } else {
        setError(err.response?.data?.error || "Failed to fetch buyer")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!buyer) return

    const confirmed = window.confirm(
      `Are you sure you want to delete ${buyer.full_name}? This action cannot be undone.`,
    )

    if (!confirmed) return

    try {
      setDeleteLoading(true)
      await buyersApi.deleteBuyer(buyer.id)
      router.push("/buyers")
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete buyer")
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return "Not specified"
    if (min && max) return `₹${(min / 100000).toFixed(1)}L - ₹${(max / 100000).toFixed(1)}L`
    if (min) return `₹${(min / 100000).toFixed(1)}L+`
    if (max) return `Up to ₹${(max / 100000).toFixed(1)}L`
    return "Not specified"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      New: "bg-blue-100 text-blue-800",
      Qualified: "bg-green-100 text-green-800",
      Contacted: "bg-yellow-100 text-yellow-800",
      Visited: "bg-purple-100 text-purple-800",
      Negotiation: "bg-orange-100 text-orange-800",
      Converted: "bg-emerald-100 text-emerald-800",
      Dropped: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const canEdit = user && buyer && (user.role === "admin" || user.id === (buyer as any).owner_id)

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <ErrorBoundary>
      <Layout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
              <Link
                href="/buyers"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Back to Buyers
              </Link>
            </div>
          ) : buyer ? (
            <>
              {/* Header */}
              <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    {buyer.full_name}
                  </h2>
                  <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(buyer.status)}`}
                      >
                        {buyer.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      Last updated: {formatDate(buyer.updated_at)}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                  <Link
                    href="/buyers"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Back to List
                  </Link>
                  {canEdit && (
                    <>
                      <Link
                        href={`/buyers/${buyer.id}/edit`}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={handleDelete}
                        disabled={deleteLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleteLoading ? "Deleting..." : "Delete"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Main Content */}
              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Column - Main Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Contact Information */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Contact Information</h3>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Phone</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            <a href={`tel:${buyer.phone}`} className="text-blue-600 hover:text-blue-500">
                              {buyer.phone}
                            </a>
                          </dd>
                        </div>
                        {buyer.email && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              <a href={`mailto:${buyer.email}`} className="text-blue-600 hover:text-blue-500">
                                {buyer.email}
                              </a>
                            </dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-sm font-medium text-gray-500">City</dt>
                          <dd className="mt-1 text-sm text-gray-900">{buyer.city}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Source</dt>
                          <dd className="mt-1 text-sm text-gray-900">{buyer.source}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Property Requirements */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Property Requirements</h3>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Property Type</dt>
                          <dd className="mt-1 text-sm text-gray-900">{buyer.property_type}</dd>
                        </div>
                        {buyer.bhk && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">BHK</dt>
                            <dd className="mt-1 text-sm text-gray-900">{buyer.bhk}</dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Purpose</dt>
                          <dd className="mt-1 text-sm text-gray-900">{buyer.purpose}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Timeline</dt>
                          <dd className="mt-1 text-sm text-gray-900">{buyer.timeline}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Budget</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatBudget(buyer.budget_min, buyer.budget_max)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Notes */}
                  {buyer.notes && (
                    <div className="bg-white shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Notes</h3>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{buyer.notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Info</h3>
                      <dl className="space-y-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Created</dt>
                          <dd className="mt-1 text-sm text-gray-900">{formatDate(buyer.created_at)}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Owner</dt>
                          <dd className="mt-1 text-sm text-gray-900">{buyer.owner_email}</dd>
                        </div>
                        {buyer.tags && buyer.tags.length > 0 && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Tags</dt>
                            <dd className="mt-1">
                              <div className="flex flex-wrap gap-2">
                                {buyer.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>

                  {/* Recent History */}
                  {history.length > 0 && (
                    <div className="bg-white shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Changes</h3>
                        <div className="flow-root">
                          <ul className="-mb-8">
                            {history.map((entry, index) => (
                              <li key={entry.id}>
                                <div className="relative pb-8">
                                  {index !== history.length - 1 && (
                                    <span
                                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                      aria-hidden="true"
                                    />
                                  )}
                                  <div className="relative flex space-x-3">
                                    <div>
                                      <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                                        <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex flex-col justify-between space-x-4">
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          {entry.diff.action === "created" && "Lead created"}
                                          {entry.diff.action === "updated" && "Lead updated"}
                                          {entry.diff.action === "imported" && "Lead imported"}
                                          {" by "}
                                          <span className="font-medium text-gray-900">{entry.changed_by_email}</span>
                                        </p>
                                        {entry.diff.changes && (
                                          <div className="mt-1">
                                            {Object.entries(entry.diff.changes).map(
                                              ([field, change]: [string, any]) => (
                                                <p key={field} className="text-xs text-gray-400">
                                                  {field}: {JSON.stringify(change.from)} → {JSON.stringify(change.to)}
                                                </p>
                                              ),
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                        {formatDate(entry.changed_at)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </Layout>
    </ErrorBoundary>
  )
}
