import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileCheck, UserCheck, RefreshCw } from 'lucide-react';
import FestApprovals from './FestApprovals';
import ProofVerificationPanel from '@/components/admin/ProofVerificationPanel';

export default function FestManagement() {
  const [activeTab, setActiveTab] = useState('payments');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Festival Management</h1>
            <p className="text-gray-400">Manage fest registrations, payments, and proofs</p>
          </div>
        </div>

        <Tabs defaultValue="payments" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/10">
            <TabsTrigger value="payments" className="gap-2">
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Payment Approvals</span>
              <span className="sm:hidden">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="proofs" className="gap-2">
              <FileCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Proof Verification</span>
              <span className="sm:hidden">Proofs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="mt-6">
            <FestApprovals />
          </TabsContent>

          <TabsContent value="proofs" className="mt-6">
            <ProofVerificationPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
