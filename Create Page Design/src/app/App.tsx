import { useState } from "react";
import svgPaths from "../imports/svg-fc53eywigu";
import imgFrame1707478741 from "figma:asset/5ffad11dc7afec8c09ef5f260d9754eb80447699.png";

interface Transaction {
  date: string;
  description: string;
  amount: string;
}

interface FeeItem {
  title: string;
  grade: string;
  status: "cleared" | "pending";
  transactions: Transaction[];
  balance: string;
}

interface UserData {
  name: string;
  balance: string;
  fees: FeeItem[];
}

const userData: Record<string, UserData> = {
  shana: {
    name: "Shana Siwale",
    balance: "K1,200.0",
    fees: [
      {
        title: "School Fees - Term 1",
        grade: "Grade 5A",
        status: "cleared",
        transactions: [
          { date: "13/02/2026", description: "School Fees Service Charge", amount: "K1,800.0" },
          { date: "13/03/2026", description: "Paid through Airtel Money", amount: "-K1,800.0" }
        ],
        balance: "-"
      }
    ]
  },
  gotham: {
    name: "Gotham Siwale",
    balance: "K1,200.0",
    fees: [
      {
        title: "School Fees - Term 1",
        grade: "Grade 5A",
        status: "pending",
        transactions: [
          { date: "13/02/2026", description: "School Fees Service Charge", amount: "K1,800.0" },
          { date: "13/03/2026", description: "Paid through Airtel Money", amount: "-K900.0" }
        ],
        balance: "K900.00"
      },
      {
        title: "Bus Fare - Term 1",
        grade: "Grade 5A",
        status: "pending",
        transactions: [
          { date: "13/02/2026", description: "School Fees Service Charge", amount: "K1,800.0" },
          { date: "13/03/2026", description: "Paid through Airtel Money", amount: "-K900.0" }
        ],
        balance: "K900.00"
      }
    ]
  }
};

function Frame2({ selectedUser }: { selectedUser: string }) {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0">
      <p className="font-['Space_Grotesk:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#95e36c] text-[12px] whitespace-nowrap">
        {userData[selectedUser].name}'s Current Balance
      </p>
    </div>
  );
}

function Frame({ selectedUser }: { selectedUser: string }) {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-end min-h-px min-w-px relative">
      <div className="flex flex-col font-['Space_Grotesk:Bold',sans-serif] font-bold justify-end leading-[0] relative shrink-0 text-[40px] text-white whitespace-nowrap">
        <p className="leading-[normal]">{userData[selectedUser].balance}</p>
      </div>
    </div>
  );
}

function Frame1({ selectedUser }: { selectedUser: string }) {
  const hasMultipleFees = userData[selectedUser].fees.length > 1;

  return (
    <div className="content-stretch flex gap-[90px] items-center pb-[4px] relative shrink-0 w-full">
      <Frame selectedUser={selectedUser} />
      {hasMultipleFees && (
        <div className="flex flex-row items-center self-stretch">
          <button className="bg-[#95e36c] h-full relative rounded-[8px] shrink-0">
            <div className="flex flex-row items-center justify-center size-full">
              <div className="content-stretch flex h-full items-center justify-center px-[25px] py-[4px] relative">
                <div className="flex flex-col font-['Space_Grotesk:Bold',sans-serif] font-bold justify-end leading-[0] relative shrink-0 text-[#003630] text-[12px] whitespace-nowrap">
                  <p className="leading-[normal] whitespace-pre">Settle  All Balances</p>
                </div>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

function Frame17({ selectedUser }: { selectedUser: string }) {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[131px] items-start left-[16px] right-[16px] pb-[16px] pt-[24px] px-[16px] rounded-[12px] top-[99px]">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[12px] size-full" src={imgFrame1707478741} />
      <Frame2 selectedUser={selectedUser} />
      <Frame1 selectedUser={selectedUser} />
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center justify-center min-h-px min-w-px relative">
      <div className="flex flex-[1_0_0] flex-col font-['Space_Grotesk:Bold',sans-serif] font-bold h-[24px] justify-end leading-[0] min-h-px min-w-px relative text-[24px] text-black text-center">
        <p className="leading-[normal]">masterfees</p>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center justify-center min-h-px min-w-px relative">
      <Frame7 />
    </div>
  );
}

function Frame3() {
  return (
    <div className="absolute bg-white content-stretch flex items-center left-0 right-0 px-[28px] py-[24px] top-0">
      <div aria-hidden="true" className="absolute border-[#e4e4e4] border-b border-solid inset-0 pointer-events-none" />
      <Frame4 />
    </div>
  );
}

function Frame5({ isActive, onClick }: { isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-full relative rounded-[12px] shrink-0 transition-all ${isActive ? 'bg-[#f5f7f9]' : 'bg-transparent'}`}
    >
      {isActive && <div aria-hidden="true" className="absolute border border-[#bcbcbc] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.15)]" />}
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[10px] h-full items-center justify-center px-[25px] py-[4px] relative">
          {isActive && (
            <div className="relative shrink-0 size-[10px]">
              <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
                <circle cx="5" cy="5" fill="var(--fill-0, #95E36C)" id="Ellipse 1671" r="5" />
              </svg>
            </div>
          )}
          <div className={`flex flex-col justify-end leading-[0] relative shrink-0 text-[12px] text-black whitespace-nowrap ${isActive ? "font-['Space_Grotesk:Bold',sans-serif] font-bold" : "font-['Space_Grotesk:Medium',sans-serif] font-medium"}`}>
            <p className="leading-[normal]">Shana Siwale</p>
          </div>
        </div>
      </div>
    </button>
  );
}

function Frame6({ isActive, onClick }: { isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-full relative rounded-[12px] shrink-0 transition-all"
    >
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex h-full items-center justify-center px-[12px] py-[4px] relative">
          <div className={`flex flex-col justify-end leading-[0] relative shrink-0 text-[12px] whitespace-nowrap ${isActive ? "font-['Space_Grotesk:Bold',sans-serif] font-bold text-black" : "font-['Space_Grotesk:Medium',sans-serif] font-medium text-[#2d2d2d]"}`}>
            <p className="leading-[normal]">Gotham Siwale</p>
          </div>
        </div>
      </div>
    </button>
  );
}

function Frame14({ selectedUser, onUserChange }: { selectedUser: string; onUserChange: (user: string) => void }) {
  return (
    <div className="absolute content-stretch flex gap-[16px] h-[50px] items-center left-[16px] right-[16px] top-[262px]">
      <Frame5 isActive={selectedUser === 'shana'} onClick={() => onUserChange('shana')} />
      <Frame6 isActive={selectedUser === 'gotham'} onClick={() => onUserChange('gotham')} />
    </div>
  );
}

function Frame8({ title }: { title: string }) {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full">
      <p className="font-['Space_Grotesk:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[16px] text-black text-center whitespace-nowrap">
        {title}
      </p>
    </div>
  );
}

function Frame9({ grade }: { grade: string }) {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0">
      <p className="font-['Space_Grotesk:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[8px] text-black text-center whitespace-nowrap">
        {grade}
      </p>
    </div>
  );
}

function Frame10({ title, grade }: { title: string; grade: string }) {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative">
      <Frame8 title={title} />
      <Frame9 grade={grade} />
    </div>
  );
}

function Group({ color = "black" }: { color?: string }) {
  return (
    <div className="h-[9.999px] relative shrink-0 w-[10.003px]" data-name="Group">
      <div className="absolute inset-[-5%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.0031 10.9991">
          <g id="Group">
            <path d={svgPaths.p19f82e80} id="Vector" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
            <path d={svgPaths.p3fbbc580} id="Vector_2" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame12({ status }: { status: "cleared" | "pending" }) {
  const isCleared = status === "cleared";
  return (
    <div className={`content-stretch flex gap-[4px] h-[26px] items-center justify-center px-[17px] relative rounded-[60px] shrink-0 ${isCleared ? 'bg-[#e0f7d4]' : 'bg-[#fff0f0]'}`}>
      <Group color={isCleared ? "black" : "#EA3030"} />
      <p className={`font-['Space_Grotesk:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[8px] text-center whitespace-nowrap ${isCleared ? 'text-[#003630]' : 'text-[#ea3030]'}`}>
        {isCleared ? 'Cleared' : 'Not Cleared'}
      </p>
    </div>
  );
}

function Frame13({ title, grade, status }: { title: string; grade: string; status: "cleared" | "pending" }) {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <Frame10 title={title} grade={grade} />
      <Frame12 status={status} />
    </div>
  );
}

function TransactionRow({ date, description, amount }: { date: string; description: string; amount: string }) {
  return (
    <div className="h-[30px] relative rounded-[6px] shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex font-normal gap-[10px] items-center leading-[normal] px-[12px] py-[3px] relative size-full text-[#585858] text-[12px]">
          <p className="font-['Space_Grotesk:Regular',sans-serif] relative shrink-0 w-[68px]">{date}</p>
          <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] min-h-px min-w-px not-italic relative">{description}</p>
          <p className="font-['Space_Grotesk:Regular',sans-serif] relative shrink-0 text-right whitespace-nowrap">{amount}</p>
        </div>
      </div>
    </div>
  );
}

function Frame19({ balance }: { balance: string }) {
  const hasBalance = balance !== "-";
  return (
    <div className="h-[30px] relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#dad9d9] border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className={`content-stretch flex font-['Space_Grotesk:Bold',sans-serif] font-bold gap-[10px] items-center leading-[normal] px-[12px] py-[6px] relative size-full text-[12px] ${hasBalance ? 'text-[#ea3030]' : 'text-[#b3b3b3]'}`}>
          <p className="flex-[1_0_0] min-h-px min-w-px relative">Balance</p>
          <p className="relative shrink-0 text-right whitespace-nowrap">{balance}</p>
        </div>
      </div>
    </div>
  );
}

function Frame21({ transactions, balance, showDetails }: { transactions: Transaction[]; balance: string; showDetails: boolean }) {
  if (!showDetails) return null;

  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full">
      <div className="content-stretch flex flex-col gap-[8px] items-start p-[12px] relative w-full">
        {transactions.map((transaction, index) => (
          <TransactionRow
            key={index}
            date={transaction.date}
            description={transaction.description}
            amount={transaction.amount}
          />
        ))}
        <Frame19 balance={balance} />
      </div>
    </div>
  );
}

function Frame22({ showDetails, onClick }: { showDetails: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-[#f5f7f9] flex-[1_0_0] h-[39px] min-h-px min-w-px relative rounded-[8px]"
    >
      <div aria-hidden="true" className="absolute border border-[#d6d6d6] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center p-[12px] relative size-full">
          <p className="flex-[1_0_0] font-['Space_Grotesk:Bold',sans-serif] font-bold leading-[normal] min-h-px min-w-px relative text-[12px] text-black text-center">
            {showDetails ? 'Hide Details' : 'Show Details'}
          </p>
        </div>
      </div>
    </button>
  );
}

function Frame23({ userName, feeTitle, grade, transactions, balance }: { userName: string; feeTitle: string; grade: string; transactions: Transaction[]; balance: string }) {
  const handleDownload = () => {
    const content = `${userName} - ${feeTitle}\n${grade}\nBalance: ${balance}\n\nTransactions:\n${transactions.map(t => `${t.date}: ${t.description} - ${t.amount}`).join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${userName.replace(' ', '_')}_${feeTitle.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="flex-[1_0_0] h-[39px] min-h-px min-w-px relative rounded-[8px]"
    >
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center p-[12px] relative size-full">
          <p className="flex-[1_0_0] font-['Space_Grotesk:Regular',sans-serif] font-normal leading-[normal] min-h-px min-w-px relative text-[#003630] text-[12px] text-center">Download</p>
        </div>
      </div>
    </button>
  );
}

function PayNowButton({ hasBalance }: { hasBalance: boolean }) {
  if (!hasBalance) return null;

  return (
    <button className="bg-[#e0f7d4] h-[39px] relative rounded-[8px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#003630] border-[0.5px] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center p-[12px] relative size-full">
          <p className="flex-[1_0_0] font-['Space_Grotesk:Bold',sans-serif] font-bold leading-[normal] min-h-px min-w-px relative text-[12px] text-black text-center">Pay Now</p>
        </div>
      </div>
    </button>
  );
}

function Frame20({ showDetails, onToggleDetails, userName, feeTitle, grade, transactions, balance }: { showDetails: boolean; onToggleDetails: () => void; userName: string; feeTitle: string; grade: string; transactions: Transaction[]; balance: string }) {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <Frame22 showDetails={showDetails} onClick={onToggleDetails} />
      <Frame23 userName={userName} feeTitle={feeTitle} grade={grade} transactions={transactions} balance={balance} />
    </div>
  );
}

function FeeCard({ fee, userName, showDetailsMap, onToggleDetails, feeIndex }: { fee: FeeItem; userName: string; showDetailsMap: Record<number, boolean>; onToggleDetails: (index: number) => void; feeIndex: number }) {
  const showDetails = showDetailsMap[feeIndex] ?? true;
  const hasBalance = fee.balance !== "-";

  return (
    <div className="bg-white content-stretch flex items-start p-[16px] rounded-[12px] w-full shrink-0">
      <div aria-hidden="true" className="absolute border border-[#e6e6e6] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.2)]" />
      <div className="flex-[1_0_0] min-h-px min-w-px relative">
        <div className="content-stretch flex flex-col gap-[16px] items-start pr-[6px] relative w-full">
          <Frame13 title={fee.title} grade={fee.grade} status={fee.status} />
          <Frame21 transactions={fee.transactions} balance={fee.balance} showDetails={showDetails} />
          <PayNowButton hasBalance={hasBalance} />
          <Frame20
            showDetails={showDetails}
            onToggleDetails={() => onToggleDetails(feeIndex)}
            userName={userName}
            feeTitle={fee.title}
            grade={fee.grade}
            transactions={fee.transactions}
            balance={fee.balance}
          />
        </div>
      </div>
    </div>
  );
}

function FeesSection({ selectedUser, showDetailsMap, onToggleDetails }: { selectedUser: string; showDetailsMap: Record<number, boolean>; onToggleDetails: (index: number) => void }) {
  const user = userData[selectedUser];

  return (
    <div className="absolute left-[16px] right-[16px] top-[344px] bottom-[16px] overflow-y-auto">
      <div className="flex flex-col gap-[16px]">
        {user.fees.map((fee, index) => (
          <FeeCard
            key={index}
            fee={fee}
            userName={user.name}
            showDetailsMap={showDetailsMap}
            onToggleDetails={onToggleDetails}
            feeIndex={index}
          />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [selectedUser, setSelectedUser] = useState<string>('shana');
  const [showDetailsMap, setShowDetailsMap] = useState<Record<number, boolean>>({});

  const handleToggleDetails = (feeIndex: number) => {
    setShowDetailsMap(prev => ({
      ...prev,
      [feeIndex]: !(prev[feeIndex] ?? true)
    }));
  };

  const handleUserChange = (user: string) => {
    setSelectedUser(user);
    setShowDetailsMap({});
  };

  return (
    <div className="bg-white relative size-full max-w-md mx-auto">
      <Frame17 selectedUser={selectedUser} />
      <Frame3 />
      <Frame14 selectedUser={selectedUser} onUserChange={handleUserChange} />
      <FeesSection selectedUser={selectedUser} showDetailsMap={showDetailsMap} onToggleDetails={handleToggleDetails} />
    </div>
  );
}