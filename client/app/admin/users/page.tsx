"use client";

import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import Table, { Column } from "@/components/ui/Table";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { User } from "@/types";
import { formatDate } from "@/lib/utils";
import { Eye } from "lucide-react";

const AdminUsersPage = () => {
  const { user } = useAuthStore();

  const mockUsers: any[] = user ? [user] : [];

  const columns: Column<User>[] = [
    {
      header: "Name",
      accessor: "name",
      className: "font-bold",
    },
    {
      header: "Email",
      accessor: "email",
    },
    {
      header: "Member Since",
      accessor: (u) => formatDate(u.createdAt),
    },
    {
      header: "Actions",
      accessor: () => (
        <Button variant="ghost" size="sm" className="text-muted hover:text-white">
          <Eye className="w-4 h-4 mr-2" />
          View Profile
        </Button>
      ),
      className: "text-right",
    },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-6 md:p-10">
        <h1 className="text-4xl font-bebas tracking-wider mb-2">User Management</h1>
        <p className="text-muted text-sm mb-10">Read-only view of registered users</p>

        <Alert
          variant="info"
          title="Restricted Access"
          message="User management is currently read-only. Full user management requires administrative API access."
          className="mb-8"
        />

        <div className="bg-surface p-6 rounded-lg border border-border">
          <Table
            columns={columns}
            data={mockUsers}
            emptyMessage="No users found."
          />
        </div>
      </main>
    </div>
  );
};

export default AdminUsersPage;
