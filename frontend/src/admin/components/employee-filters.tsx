import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';

import { departments } from '../data/seed';
import type { EmploymentStatus, EmploymentType } from '../types';

export function EmployeeFilters({
  query,
  department,
  status,
  employmentType,
  onQueryChange,
  onDepartmentChange,
  onStatusChange,
  onEmploymentTypeChange,
}: {
  query: string;
  department: string;
  status: 'all' | EmploymentStatus;
  employmentType: 'all' | EmploymentType;
  onQueryChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onStatusChange: (value: 'all' | EmploymentStatus) => void;
  onEmploymentTypeChange: (value: 'all' | EmploymentType) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5">
      <label className="relative min-w-48 flex-1">
        <span className="sr-only">Search employees</span>
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          className="h-8 pl-8"
          placeholder="Search employees..."
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
          }}
        />
      </label>
      <FilterSelect
        label="Department"
        value={department}
        onChange={onDepartmentChange}
        options={[{ value: 'all', label: 'All' }, ...departments.map((item) => ({ value: item, label: item }))]}
      />
      <FilterSelect
        label="Status"
        value={status}
        onChange={(value) => {
          if (value === 'all' || value === 'active' || value === 'inactive') {
            onStatusChange(value);
          }
        }}
        options={[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
      />
      <FilterSelect
        label="Employment type"
        value={employmentType}
        onChange={(value) => {
          if (value === 'all' || value === 'full-time' || value === 'part-time' || value === 'contract') {
            onEmploymentTypeChange(value);
          }
        }}
        options={[
          { value: 'all', label: 'All' },
          { value: 'full-time', label: 'Full-time' },
          { value: 'part-time', label: 'Part-time' },
          { value: 'contract', label: 'Contract' },
        ]}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="text-muted-foreground flex items-center gap-1.5 text-xs">
      {label}
      <select
        className="border-input bg-background text-foreground h-8 rounded-md border px-2 text-xs"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
