import { FC, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Hourglass,
} from "lucide-react";

export type DealStatus = "INIT" | "FUNDED" | "DISPUTED" | "RESOLVED";

export interface DealCardProps {
  readonly title: string;
  readonly counterparty: string;
  readonly amountUsd: number;
  readonly deadline: string; // ISO or display string
  readonly status: DealStatus;
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
  };
  return map[status];
};

export const DealCard: FC<DealCardProps> = ({
  title,
  counterparty,
  amountUsd,
  deadline,
  status,
}) => {
  return (
    <Card className="group relative flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:border-blue-300">
      <div className="relative z-10 flex items-center justify-between">
        {statusIcon(status)}
        <div className={statusBadge(status)}>{status}</div>
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

