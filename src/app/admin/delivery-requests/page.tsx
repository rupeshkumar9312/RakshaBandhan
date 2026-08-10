import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { TruckIcon, PhoneIcon } from "@/components/icons";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Delivery requests" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type ItemSnapshot = { productId: string; name: string; quantity: number };

function parseItems(raw: string | null): ItemSnapshot[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async function AdminDeliveryRequestsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : undefined;

  const where: Prisma.DemandLeadWhereInput = q
    ? {
        OR: [
          { contactName: { contains: q } },
          { contactPhone: { contains: q } },
          { requestedAddress: { contains: q } },
          { pincode: { contains: q } },
        ],
      }
    : {};

  const leads = await prisma.demandLead.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Delivery requests</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {leads.length} request{leads.length === 1 ? "" : "s"} from checkouts outside
            today&apos;s delivery footprint
          </p>
        </div>

        <form action="/admin/delivery-requests" className="flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Name, phone, address or PIN"
            aria-label="Search delivery requests"
            className="field py-2.5 text-sm sm:w-64"
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>
      </header>

      {leads.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-20 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-cream-200">
            <TruckIcon className="size-6 text-ink-muted" />
          </div>
          <p className="font-semibold">No requests yet</p>
          <p className="max-w-xs text-sm text-ink-muted">
            When a checkout address doesn&apos;t match an active society, it&apos;s
            captured here instead of being rejected outright.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="border-b border-cream-300 bg-cream-50 text-left">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Requested address
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Contact
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Items wanted
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Requested
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300">
              {leads.map((lead) => {
                const items = parseItems(lead.itemsSnapshot);
                return (
                  <tr key={lead.id} className="hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{lead.requestedAddress}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {[lead.flat, lead.tower, lead.landmark].filter(Boolean).join(", ")}
                        {(lead.flat || lead.tower || lead.landmark) && " · "}
                        {lead.city}, {lead.state} — {lead.pincode}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-medium">{lead.contactName}</p>
                      <a
                        href={`tel:+91${lead.contactPhone}`}
                        className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-soft hover:text-maroon-700"
                      >
                        <PhoneIcon className="size-3.5" /> +91 {lead.contactPhone}
                      </a>
                    </td>

                    <td className="px-4 py-3 text-xs text-ink-soft">
                      {items.length > 0
                        ? items.map((i) => `${i.quantity}× ${i.name}`).join(", ")
                        : "—"}
                    </td>

                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {formatDate(lead.createdAt, true)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
