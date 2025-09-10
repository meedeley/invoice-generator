"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { TrendingUp, TrendingDown, DollarSign, Package, FileText, Calendar, BarChart3, Filter, X } from "lucide-react"
import { generateReport, getInvoices, getProducts, type Invoice, type Product } from "@/lib/data"
import { formatRupiah } from "@/lib/utils"

interface ReportData {
  totalRevenue: number
  totalCost: number
  profit: number
}

export function ReportsView() {
  const [reportData, setReportData] = useState<ReportData>({ totalRevenue: 0, totalCost: 0, profit: 0 })
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [reportData, allInvoices, allProducts] = await Promise.all([
          generateReport(),
          getInvoices(),
          getProducts(),
        ])

        setReportData(reportData)
        setInvoices(allInvoices)
        setFilteredInvoices(allInvoices)
        setProducts(allProducts)
      } catch (err) {
        console.error("[v0] Error loading reports data:", err)
        setError("Failed to load reports data")
        // Set default empty arrays to prevent map/forEach errors
        setInvoices([])
        setFilteredInvoices([])
        setProducts([])
        setReportData({ totalRevenue: 0, totalCost: 0, profit: 0 })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const applyDateFilter = () => {
    if (!startDate && !endDate) {
      setFilteredInvoices(invoices)
      return
    }

    const filtered = (invoices || []).filter((invoice) => {
      const invoiceDate = new Date(invoice.created_at)
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null

      if (start && end) {
        return invoiceDate >= start && invoiceDate <= end
      } else if (start) {
        return invoiceDate >= start
      } else if (end) {
        return invoiceDate <= end
      }
      return true
    })

    setFilteredInvoices(filtered)
  }

  const resetDateFilter = () => {
    setStartDate("")
    setEndDate("")
    setFilteredInvoices(invoices || [])
  }

  const getFilteredReportData = () => {
    let totalRevenue = 0
    let totalCost = 0
    ;(filteredInvoices || []).forEach((invoice) => {
      totalRevenue += invoice.total_amount
      ;(invoice.products || []).forEach((item) => {
        const product = (products || []).find((p) => p.id === item.product_id)
        if (product) {
          totalCost += product.cost_price * item.quantity
        }
      })
    })

    return {
      totalRevenue,
      totalCost,
      profit: totalRevenue - totalCost,
    }
  }

  const getProductPerformance = () => {
    const productStats: Record<string, { name: string; quantitySold: number; revenue: number; cost: number }> = {}
    ;(filteredInvoices || []).forEach((invoice) => {
      ;(invoice.products || []).forEach((item) => {
        const product = (products || []).find((p) => p.id === item.product_id)
        if (product) {
          if (!productStats[product.id]) {
            productStats[product.id] = {
              name: product.name,
              quantitySold: 0,
              revenue: 0,
              cost: 0,
            }
          }
          productStats[product.id].quantitySold += item.quantity
          productStats[product.id].revenue += product.selling_price * item.quantity
          productStats[product.id].cost += product.cost_price * item.quantity
        }
      })
    })

    return Object.values(productStats).sort((a, b) => b.revenue - a.revenue)
  }

  const getMonthlyData = () => {
    const monthlyStats: Record<string, { revenue: number; invoiceCount: number }> = {}
    ;(filteredInvoices || []).forEach((invoice) => {
      const date = new Date(invoice.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { revenue: 0, invoiceCount: 0 }
      }

      monthlyStats[monthKey].revenue += invoice.total_amount
      monthlyStats[monthKey].invoiceCount += 1
    })

    return Object.entries(monthlyStats)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Business Reports</h2>
          <p className="text-muted-foreground">Loading reports data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Business Reports</h2>
          <p className="text-red-600">Error: {error}</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Unable to load reports data. Please try refreshing the page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredReportData = getFilteredReportData()
  const profitMargin =
    filteredReportData.totalRevenue > 0 ? (filteredReportData.profit / filteredReportData.totalRevenue) * 100 : 0
  const isProfitable = filteredReportData.profit > 0

  const productPerformance = getProductPerformance()

  const monthlyData = getMonthlyData()

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  const revenueVsCostData = [
    { name: "Revenue", value: filteredReportData.totalRevenue, fill: "#00C49F" },
    { name: "Cost", value: filteredReportData.totalCost, fill: "#FF8042" },
    { name: "Profit", value: filteredReportData.profit, fill: filteredReportData.profit >= 0 ? "#0088FE" : "#FF0000" },
  ]

  const monthlyChartData = monthlyData.map((month) => ({
    month: new Date(month.month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    revenue: month.revenue,
    invoices: month.invoiceCount,
  }))

  const productChartData = productPerformance.slice(0, 5).map((product) => ({
    name: product.name.length > 15 ? product.name.substring(0, 15) + "..." : product.name,
    revenue: product.revenue,
    profit: product.revenue - product.cost,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Business Reports</h2>
        <p className="text-muted-foreground">Overview of your business performance and analytics</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Date Filter
          </CardTitle>
          <CardDescription>Filter reports by date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="start-date">Start Date</Label>
              <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <Label htmlFor="end-date">End Date</Label>
              <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={applyDateFilter}>
                <Filter className="w-4 h-4 mr-2" />
                Apply Filter
              </Button>
              <Button variant="outline" onClick={resetDateFilter}>
                <X className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
          {(startDate || endDate) && (
            <div className="mt-2 text-sm text-muted-foreground">
              Showing {filteredInvoices.length} of {invoices.length} invoices
              {startDate &&
                endDate &&
                ` from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`}
              {startDate && !endDate && ` from ${new Date(startDate).toLocaleDateString()}`}
              {!startDate && endDate && ` until ${new Date(endDate).toLocaleDateString()}`}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatRupiah(filteredReportData.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From {filteredInvoices.length} invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatRupiah(filteredReportData.totalCost)}</div>
            <p className="text-xs text-muted-foreground">Cost of goods sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            {isProfitable ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isProfitable ? "text-green-600" : "text-red-600"}`}>
              {formatRupiah(filteredReportData.profit)}
            </div>
            <p className="text-xs text-muted-foreground">{profitMargin.toFixed(1)}% profit margin</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Profit Analysis
          </CardTitle>
          <CardDescription>Breakdown of revenue vs costs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Revenue</span>
              <span className="font-medium">{formatRupiah(filteredReportData.totalRevenue)}</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Costs</span>
              <span className="font-medium">{formatRupiah(filteredReportData.totalCost)}</span>
            </div>
            <Progress
              value={
                filteredReportData.totalRevenue > 0
                  ? (filteredReportData.totalCost / filteredReportData.totalRevenue) * 100
                  : 0
              }
              className="h-2"
            />
          </div>

          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Profit Margin</span>
              <Badge variant={isProfitable ? "default" : "destructive"}>{profitMargin.toFixed(1)}%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Revenue vs Cost Analysis
            </CardTitle>
            <CardDescription>Visual breakdown of financial performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "#00C49F" },
                cost: { label: "Cost", color: "#FF8042" },
                profit: { label: "Profit", color: "#0088FE" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueVsCostData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(1)}M`} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => [formatRupiah(Number(value)), ""]}
                  />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit Distribution</CardTitle>
            <CardDescription>Revenue and cost breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "#00C49F" },
                cost: { label: "Cost", color: "#FF8042" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Revenue", value: filteredReportData.totalRevenue, fill: "#00C49F" },
                      { name: "Cost", value: filteredReportData.totalCost, fill: "#FF8042" },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {revenueVsCostData.slice(0, 2).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => [formatRupiah(Number(value)), ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Product Performance
          </CardTitle>
          <CardDescription>Revenue and sales by product</CardDescription>
        </CardHeader>
        <CardContent>
          {productPerformance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sales data available. Create some invoices to see product performance.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Quantity Sold</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productPerformance.map((product, index) => {
                  const profit = product.revenue - product.cost
                  const margin = product.revenue > 0 ? (profit / product.revenue) * 100 : 0

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.quantitySold}</TableCell>
                      <TableCell className="text-green-600 font-medium">{formatRupiah(product.revenue)}</TableCell>
                      <TableCell className="text-red-600">{formatRupiah(product.cost)}</TableCell>
                      <TableCell className={profit >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {formatRupiah(profit)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={margin >= 0 ? "default" : "destructive"}>{margin.toFixed(1)}%</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {productChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Top Products Performance
            </CardTitle>
            <CardDescription>Revenue and profit by top 5 products</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "#00C49F" },
                profit: { label: "Profit", color: "#0088FE" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(1)}M`} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => [formatRupiah(Number(value)), ""]}
                  />
                  <Bar dataKey="revenue" fill="#00C49F" />
                  <Bar dataKey="profit" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Monthly Overview
          </CardTitle>
          <CardDescription>Revenue and invoice count by month</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No monthly data available. Create some invoices to see trends.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Invoices</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Avg. Invoice Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((month, index) => {
                  const avgInvoiceValue = month.invoiceCount > 0 ? month.revenue / month.invoiceCount : 0

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {new Date(month.month + "-01").toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {month.invoiceCount}
                        </div>
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">{formatRupiah(month.revenue)}</TableCell>
                      <TableCell>{formatRupiah(avgInvoiceValue)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {monthlyChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Monthly Revenue Trend
            </CardTitle>
            <CardDescription>Revenue performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "#0088FE" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(1)}M`} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => [formatRupiah(Number(value)), "Revenue"]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#0088FE" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Business Summary</CardTitle>
          <CardDescription>Key insights and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Performance Metrics</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Total Products: {products.length}</li>
                <li>• Total Invoices: {filteredInvoices.length}</li>
                <li>
                  • Average Invoice Value:{" "}
                  {formatRupiah(
                    filteredInvoices.length > 0 ? filteredReportData.totalRevenue / filteredInvoices.length : 0,
                  )}
                </li>
                <li>• Best Performing Product: {productPerformance[0]?.name || "N/A"}</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Financial Health</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Profit Status: {isProfitable ? "Profitable" : "Loss Making"}</li>
                <li>• Profit Margin: {profitMargin.toFixed(1)}%</li>
                <li>
                  • Cost Ratio:{" "}
                  {filteredReportData.totalRevenue > 0
                    ? ((filteredReportData.totalCost / filteredReportData.totalRevenue) * 100).toFixed(1)
                    : "0"}
                  %
                </li>
                <li>• Revenue Growth: {monthlyData.length > 1 ? "Available" : "Need more data"}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
