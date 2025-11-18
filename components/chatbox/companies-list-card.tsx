import { getStringValue } from "@/lib/utils";

interface Company {
  uuid?: string;
  id?: string;
  name?: any;
  email?: string;
  address?: any;
}

interface CompaniesListCardProps {
  companies: Company[];
}

export function CompaniesListCard({ companies }: CompaniesListCardProps) {
  return (
    <div className="space-y-3">
      <div className="font-semibold">Companies List</div>
      {companies.length > 0 ? (
        <div className="space-y-2">
          {companies.map((company, index) => {
            const name = getStringValue(company.name);
            const address = getStringValue(company.address);

            return (
              <div
                key={company.uuid || company.id || index}
                className="border rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800"
              >
                {name && <div className="font-medium">{name}</div>}
                {company.uuid && (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    UUID: {company.uuid}
                  </div>
                )}
                {company.email && (
                  <div className="text-sm mt-1 text-zinc-600 dark:text-zinc-300">
                    Email: {company.email}
                  </div>
                )}
                {address && (
                  <div className="text-sm mt-1 text-zinc-600 dark:text-zinc-300">
                    Address: {address}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          No companies found
        </div>
      )}
      <div className="text-xs text-zinc-400 dark:text-zinc-500">
        Total companies: {companies.length}
      </div>
    </div>
  );
}
