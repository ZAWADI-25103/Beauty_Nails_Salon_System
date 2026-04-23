"use client"

import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Bell, AlertCircle, Calendar, Package, DollarSign, Users, MessageSquare, X, Clock, CalendarIcon, XCircle } from 'lucide-react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { ScrollArea } from './ui/scroll-area';

interface Notification {
  id: string;
  type: 'appointment' | 'stock' | 'payment' | 'system' | 'client';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function NotificationCenter() {
  // Get notifications
  const {
    notifications: notificationList = [],
    unreadCount = 0,
    markAsRead,
    markAllAsRead
  } = useNotifications({ limit: 50 });

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_confirmed':
        return <CalendarIcon className="w-5 h-5 text-blue-500" />;
      case 'appointment_cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <Card className="bg-transparent dark:bg-transparent border-none">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-6 h-6 text-pink-500" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-950">
                <span className="text-[10px]  text-white">{unreadCount}</span>
              </div>
            )}
          </div>
          <h3 className="text-xl  text-gray-900 dark:text-gray-100">Notifications</h3>
        </div>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => markAllAsRead()}
            className="mt-6 text-lg font-semibold text-pink-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20"
          >
            Tout marquer lu
          </Button>
        )}
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
        {notificationList.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-950 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-300 dark:text-gray-700" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune notification</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-150px)]">
            <div className="space-y-4">
              {notificationList.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                notificationList.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border cursor-pointer dark:border-gray-700 ${notification.isRead ? 'bg-white dark:bg-gray-800' : 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
                      }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{notification.title}</h3>
                        <p className="text-lg text-gray-600 dark:text-gray-300">{notification.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Quick Actions */}
      {unreadCount > 0 && (
        <div className="pt-6 border-t border-gray-100 dark:border-pink-900/30">
          <p className="text-base  text-gray-500 dark:text-gray-400 uppercase tracking-widest">Actions Rapides</p>
          <div className="grid grid-cols-2 gap-3">
            <Button size="sm" variant="outline" className="rounded-full py-2 border-pink-100 dark:border-pink-900 dark:text-gray-300 dark:hover:bg-pink-900/20">
              <MessageSquare className="w-3.5 h-3.5 mr-2 text-pink-500" />
              SMS
            </Button>
            <Button size="sm" variant="outline" className="rounded-full py-2 border-pink-100 dark:border-pink-900 dark:text-gray-300 dark:hover:bg-pink-900/20">
              <Package className="w-3.5 h-3.5 mr-2 text-pink-500" />
              Stock
            </Button>
          </div>
        </div>
      )}

      {/* Alert Summary */}
      <Card className="bg-linear-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-lg  text-gray-900 dark:text-gray-100">Alertes Actives</p>
        </div>
        <div className="space-y-2 text-base font-medium text-gray-600 dark:text-gray-400">
          <div className="flex items-center justify-between">
            <span>Alertes Stock</span>
            <Badge variant="outline" className="h-5 bg-white dark:bg-gray-950 border-red-100 dark:border-red-900/50">
              {notificationList.filter(n => n.type === 'system' && !n.isRead).length}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Paiements en attente</span>
            <Badge variant="outline" className="h-5 bg-white dark:bg-gray-950 border-red-100 dark:border-red-900/50">
              {notificationList.filter(n => n.type === 'appointment_confirmed' && !n.isRead).length}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Notifications RDV</span>
            <Badge variant="outline" className="h-5 bg-white dark:bg-gray-950 border-red-100 dark:border-red-900/50">
              {notificationList.filter(n => n.type === 'system' && !n.isRead).length}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Notifications du Systeme</span>
            <Badge variant="outline" className="h-5 bg-white dark:bg-gray-950 border-red-100 dark:border-red-900/50">
              {notificationList.filter(n => n.type === 'system' && !n.isRead).length}
            </Badge>
          </div>
        </div>
      </Card>
    </Card>
  );
}
