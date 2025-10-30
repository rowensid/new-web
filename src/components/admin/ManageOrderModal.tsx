'use client'

import { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, X } from 'lucide-react'
import { OrderStatus } from '@prisma/client'

interface Order {
  id: string
  amount: number
  status: OrderStatus
  paymentMethod?: string
  adminNotes?: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  storeItem?: {
    title: string
    category: string
  }
  service?: {
    name: string
    type: string
  }
}

interface ManageOrderModalProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (orderId: string, data: { status?: OrderStatus; adminNotes?: string }) => Promise<void>
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  VALIDATING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  REFUNDED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
}

export function ManageOrderModal({ 
  order, 
  isOpen, 
  onClose, 
  onUpdate 
}: ManageOrderModalProps) {
  const [status, setStatus] = useState<OrderStatus>(order?.status || 'PENDING')
  const [adminNotes, setAdminNotes] = useState(order?.adminNotes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return

    setIsSubmitting(true)
    try {
      await onUpdate(order.id, { status, adminNotes })
      onClose()
    } catch (error) {
      console.error('Failed to update order:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getItemName = () => {
    if (order?.service?.name) return order.service.name
    if (order?.storeItem?.title) return order.storeItem.title
    return 'Unknown Item'
  }

  const getItemType = () => {
    if (order?.service?.type) return order.service.type
    if (order?.storeItem?.category) return order.storeItem.category
    return 'UNKNOWN'
  }

  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Info */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Order Information
            </Label>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Item:</span>
                <span className="text-sm font-medium">{getItemName()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                <span className="text-sm font-medium">{getItemType()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="text-sm font-medium">Rp {order.amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Customer:</span>
                <span className="text-sm font-medium">{order.user.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                <span className="text-sm font-medium">{order.user.email}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    Pending
                  </div>
                </SelectItem>
                <SelectItem value="VALIDATING">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Validating
                  </div>
                </SelectItem>
                <SelectItem value="COMPLETED">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Completed
                  </div>
                </SelectItem>
                <SelectItem value="CANCELLED">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Cancelled
                  </div>
                </SelectItem>
                <SelectItem value="REFUNDED">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    Refunded
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="adminNotes">Notes for Customer</Label>
            <Textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Enter notes for the customer (e.g., account details, instructions, etc.)"
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              These notes will be visible to the customer when the order status is "Completed"
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Order
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}