import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { firstFieldMessage } from '@/lib/form-errors';

import type { TenantAdmin } from '../api/tenants-api';
import {
  useDeleteTenant,
  useDeleteTenantAdmin,
  useTenant,
  useTenantAdmins,
  useUpdateTenant,
} from '../api/tenants-queries';
import { TenantAdminFormDialog } from '../components/tenant-admin-form-dialog';
import { TenantAdminTable } from '../components/tenant-admin-table';

const editSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Use at least 2 characters.')
    .max(200, 'Use at most 200 characters.'),
});

type EditValues = z.infer<typeof editSchema>;

export function CompanyDetailPage() {
  const { tenantId } = useParams();

  if (!tenantId) {
    return <Navigate to="/" replace />;
  }

  return <CompanyDetail tenantId={tenantId} />;
}

function CompanyDetail({ tenantId }: { tenantId: string }) {
  const navigate = useNavigate();
  const tenantQuery = useTenant(tenantId);
  const adminsQuery = useTenantAdmins(tenantId);
  const updateMutation = useUpdateTenant(tenantId);
  const deleteMutation = useDeleteTenant();
  const deleteAdminMutation = useDeleteTenantAdmin(tenantId);

  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    values: { name: tenantQuery.data?.name ?? '' },
  });

  if (tenantQuery.isPending) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (tenantQuery.isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {tenantQuery.error.message}
      </p>
    );
  }

  const tenant = tenantQuery.data;

  const onSave = handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({ name: values.name, isActive: tenant.isActive });
      reset(values);
      toast.success('Company updated.');
    } catch (error) {
      const fieldMessage = firstFieldMessage(error, 'name');

      if (fieldMessage) {
        setError('name', { message: fieldMessage });
        return;
      }

      toast.error(error instanceof Error ? error.message : 'Could not update the company.');
    }
  });

  async function toggleActive() {
    try {
      await updateMutation.mutateAsync({
        name: tenant.name,
        isActive: !tenant.isActive,
      });
      toast.success(tenant.isActive ? 'Company deactivated.' : 'Company reactivated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update status.');
    }
  }

  async function confirmDelete() {
    if (confirmName.trim() !== tenant.name) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(tenantId);
      toast.success(`Deleted ${tenant.name}.`);
      void navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete the company.');
    }
  }

  async function removeAdmin(admin: TenantAdmin) {
    try {
      await deleteAdminMutation.mutateAsync(admin.id);
      toast.success(`Removed ${admin.email}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove the admin.');
    }
  }

  const isSaving = isSubmitting || updateMutation.isPending;

  return (
    <div className="space-y-8">
      <div>
        <Link to="/" className="text-muted-foreground text-sm hover:underline">
          Companies
        </Link>
        <header className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{tenant.name}</h1>
            <p className="text-muted-foreground text-sm">
              {tenant.slug} · {tenant.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void toggleActive()}
              disabled={updateMutation.isPending}
            >
              {tenant.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
            <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
          </div>
        </header>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company name</CardTitle>
          <CardDescription>The slug stays the same when you rename a company.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => void onSave(event)}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="edit-company-name">Name</Label>
              <Input
                id="edit-company-name"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? 'edit-company-name-error' : undefined}
                {...register('name')}
              />
              {errors.name ? (
                <p id="edit-company-name-error" className="text-destructive text-xs" role="alert">
                  {errors.name.message}
                </p>
              ) : null}
            </div>
            <Button type="submit" className="sm:mt-6" disabled={isSaving || !isDirty}>
              {isSaving ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Tenant admins</h2>
            <p className="text-muted-foreground text-sm">
              These people can sign in to the company workspace.
            </p>
          </div>
          <Button type="button" onClick={() => setAddAdminOpen(true)}>
            Add tenant admin
          </Button>
        </header>

        {adminsQuery.isPending ? <Skeleton className="h-24 w-full" /> : null}

        {adminsQuery.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {adminsQuery.error.message}
          </p>
        ) : null}

        {adminsQuery.data ? (
          adminsQuery.data.items.length > 0 ? (
            <TenantAdminTable
              admins={adminsQuery.data.items}
              onRemove={(admin) => void removeAdmin(admin)}
              busyAdminId={
                deleteAdminMutation.isPending ? deleteAdminMutation.variables : undefined
              }
            />
          ) : (
            <p className="text-muted-foreground py-6 text-sm">
              Add at least one admin so this company can sign in.
            </p>
          )
        ) : null}
      </section>

      <TenantAdminFormDialog
        tenantId={tenantId}
        open={addAdminOpen}
        onClose={() => setAddAdminOpen(false)}
      />

      <Modal
        open={deleteOpen}
        title="Delete this company?"
        onClose={() => {
          setConfirmName('');
          setDeleteOpen(false);
        }}
      >
        <p className="text-muted-foreground mb-4 text-sm">
          This permanently deletes {tenant.name} and every tenant admin. Type the company name to
          confirm.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-company-name">Company name</Label>
          <Input
            id="confirm-company-name"
            value={confirmName}
            onChange={(event) => setConfirmName(event.target.value)}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={confirmName.trim() !== tenant.name || deleteMutation.isPending}
            onClick={() => void confirmDelete()}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : null}
            Delete company
          </Button>
        </div>
      </Modal>
    </div>
  );
}
