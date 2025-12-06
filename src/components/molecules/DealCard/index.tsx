import { FC, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, BadgeCheck, CheckCircle2, Hourglass, PackageCheck, Undo2, Trash2 } from "lucide-react";

export type DealStatus = "INIT" | "FUNDED" | "DISPUTED" | "RESOLVED" | "RELEASED" | "REFUNDED" | "DELIVERED";

export interface DealCardProps {
  readonly dealId?: string;
  readonly title: string;
  readonly counterparty: string;
  readonly amountUsd: number;
  readonly deadline: string; // ISO or display string
  readonly status: DealStatus;
  readonly onDelete?: (id: string) => void;
}

const statusIcon = (status: DealStatus): ReactNode => {
  switch (status) {
    case "INIT":
      return <Hourglass className="text-orange-500 w-7 h-7" aria-hidden />;
    case "FUNDED":
      return <CheckCircle2 className="text-green-600 w-7 h-7" aria-hidden />;
    case "DISPUTED":
      return <AlertCircle className="text-red-600 w-7 h-7" aria-hidden />;
    case "RESOLVED":
      return <BadgeCheck className="text-blue-600 w-7 h-7" aria-hidden />;
    case "RELEASED":
      return <BadgeCheck className="text-emerald-600 w-7 h-7" aria-hidden />;
    case "REFUNDED":
      return <Undo2 className="text-purple-600 w-7 h-7" aria-hidden />;
    case "DELIVERED":
      return <PackageCheck className="text-amber-600 w-7 h-7" aria-hidden />;
    default:
      return null;
  }
};

const statusBadge = (status: DealStatus) => {
  const map: Record<DealStatus, string> = {
    INIT: "rounded-full px-3 py-1 text-xs font-semibold text-orange-800 bg-orange-100 uppercase",
    FUNDED: "rounded-full px-3 py-1 text-xs font-semibold text-green-800 bg-green-100 uppercase",
    DISPUTED: "rounded-full px-3 py-1 text-xs font-semibold text-red-800 bg-red-100 uppercase",
    RESOLVED: "rounded-full px-3 py-1 text-xs font-semibold text-blue-800 bg-blue-100 uppercase",
    RELEASED: "rounded-full px-3 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 uppercase",
    REFUNDED: "rounded-full px-3 py-1 text-xs font-semibold text-purple-800 bg-purple-100 uppercase",
    DELIVERED: "rounded-full px-3 py-1 text-xs font-semibold text-amber-800 bg-amber-100 uppercase",
  };
  return map[status];
};

export const DealCard: FC<DealCardProps> = ({
  dealId,
  title,
  counterparty,
  amountUsd,
  deadline,
  status,
  onDelete,
}) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking delete button
    if ((e.target as HTMLElement).closest('button')) return;

    if (dealId) {
      navigate(`/deal/${dealId}`);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dealId && onDelete) {
      onDelete(dealId);
    }
  };

  return (
    <Card
      className="group relative flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:border-blue-300 cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusIcon(status)}
          <div className={statusBadge(status)}>{status}</div>
        </div>
        {status === "INIT" && onDelete && (
          <button
            onClick={handleDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Delete Deal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <h3 className="relative z-10 text-lg font-bold text-gray-900">{title}</h3>
      <p className="relative z-10 text-sm text-gray-600">Counterparty: {counterparty}</p>
      <div className="relative z-10 flex items-end justify-between text-gray-900">
        <span className="text-xl font-bold">${amountUsd.toLocaleString()}</span>
        <span className="text-sm text-gray-500">Deadline: {deadline}</span>
      </div>
    </Card>
  );
};

export default DealCard;
