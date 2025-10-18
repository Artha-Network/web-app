import { FC } from "react";
import HeaderBar from "@/components/organisms/HeaderBar";
import DashboardGreeting from "@/components/organisms/DashboardGreeting";
import DealActions from "@/components/molecules/DealActions";
import ActiveDealsGrid from "@/components/organisms/ActiveDealsGrid";
import ReputationScoreCard from "@/components/molecules/ReputationScoreCard";
import NotificationsList from "@/components/organisms/NotificationsList";
import RecentActivityTimeline from "@/components/organisms/RecentActivityTimeline";
import { Banknote, Gavel, CheckCircle2, Star, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchDeals } from "@/api/mockApi";
import { useWallet } from "@/hooks/useWallet";

// Deals now fetched via mock API (temporary)

const mockNotifications = [
  {
    id: "n1",
    icon: <Banknote className="text-green-600 w-7 h-7" aria-hidden />,
    title: "Deal with Sarah Johnson funded!",
    date: "2024-07-28",
  },
  {
    id: "n2",
    icon: <Gavel className="text-red-600 w-7 h-7" aria-hidden />,
    title: "Dispute initiated by Emily Chen!",
    date: "2024-07-25",
  },
];

const mockActivities = [
  {
    id: "a1",
    icon: <CheckCircle2 />, // styled via colorClass
    title: 'Deal "Secure Sale" completed!',
    date: "2024-07-28",
    colorClass: "text-green-600",
  },
  {
    id: "a2",
    icon: <Star />,
    title: "New reputation tier unlocked!",
    date: "2024-07-25",
    colorClass: "text-blue-600",
  },
  {
    id: "a3",
    icon: <Award />,
    title: '"Master Arbitrator" badge earned!',
    date: "2024-07-20",
    colorClass: "text-purple-600",
  },
];

const Dashboard: FC = () => {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const address = publicKey?.toBase58();
  const userName = address ? address.slice(0, 6) + "…" + address.slice(-4) : "User";
  const { data: deals = [] } = useQuery({ queryKey: ["deals", address], queryFn: () => fetchDeals(address) });

  return (
    <div
      className="relative flex h-auto min-h-screen w-full flex-col bg-white group/design-root overflow-x-hidden"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <HeaderBar
          userName={userName}
          avatarUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuAPp2y2Cah7z1UIbc18diVtfZ0q9F-TnVTK9Lvk5mOT7PdzYTfFh3EMkRB9-tVlgcKZaSE31AcQ8amNjJ1U4WJ4mqapt_s_qGDjvnMrcxbLXQAKaekEr2g11mX5hO3yesWvtsYReBCSvFZJjDJ_-L9p0z8YspicW5HtP0zDRXFKKmGoRioxwlpZ5MHgCy4nS2NSdOCb397BT3WuH6qDrJ_Wvj3KUSwT_9yNsGFv9H_w38WJt0QP3E6-H06eTnZFn-MXLyAELbjWxHzD"
        />

        <main className="gap-1 px-6 flex flex-1 justify-center py-5 bg-gray-50">
          <div className="layout-content-container flex flex-col max-w-[920px] flex-1">
            <DashboardGreeting name={userName} />

            <DealActions onCreateEscrow={() => navigate("/escrow/step1")} />

            <h2 className="text-gray-900 text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              Your Active Deals
            </h2>
            <ActiveDealsGrid deals={deals} />
          </div>

          <aside className="layout-content-container flex flex-col w-[360px] gap-4">
            <ReputationScoreCard score={95} />

            <h2 className="text-gray-900 text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              Notifications
            </h2>
            <NotificationsList items={mockNotifications} />

            <h2 className="text-gray-900 text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              Recent Activity
            </h2>
            <RecentActivityTimeline items={mockActivities} />
          </aside>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
