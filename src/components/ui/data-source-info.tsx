'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Info, 
  Server, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface DataSourceInfoProps {
  className?: string
}

export function DataSourceInfo({ className = '' }: DataSourceInfoProps) {
  return (
    <Card className={`bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">Status Data Server</h4>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  LIVE
                </Badge>
                <span className="text-gray-300">
                  Data real-time dari Pterodactyl Panel (CPU, Memory aktual)
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  SIM
                </Badge>
                <span className="text-gray-300">
                  Data simulasi (server sedang offline atau API tidak accessible)
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-blue-500/20">
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <Server className="h-3 w-3" />
                <span>
                  Status server dicek melalui koneksi port ({' '}
                  <span className="text-green-400">● Running</span>{' / '}
                  <span className="text-red-400">● Stopped</span>{' )'}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                <Activity className="h-3 w-3" />
                <span>
                  Resource data diperbarui setiap 5 detik
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}