/**
 * iOS Features Demo & Showcase
 * Demonstrates all new iOS-level enhancements
 */

import { useState } from "react";
import { motion } from "motion/react";
import {
  CreditCard,
  Search,
  Share2,
  Sparkles,
  ArrowLeft,
  Receipt,
  School,
  User
} from "lucide-react";
import DynamicIsland, { useDynamicIsland } from "./DynamicIsland";
import ApplePayCard from "./ApplePayCard";
import IOSShareSheet from "./IOSShareSheet";
import SpotlightSearch from "./SpotlightSearch";
import type { SearchResult } from "./SpotlightSearch";
import {
  IOSSwitch,
  SegmentedControl,
  IOSPicker,
  IOSSlider,
  IOSStepper
} from "./IOSControls";
import { haptics } from "../utils/haptics";
import { toast } from "sonner";

interface IOSFeaturesDemoProps {
  onClose: () => void;
}

export default function IOSFeaturesDemo({ onClose }: IOSFeaturesDemoProps) {
  const [activeTab, setActiveTab] = useState(0);

  // Dynamic Island State
  const dynamicIsland = useDynamicIsland();

  // Apple Pay Card State
  const [showApplePayCard, setShowApplePayCard] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Share Sheet State
  const [showShareSheet, setShowShareSheet] = useState(false);

  // Spotlight Search State
  const [showSpotlight, setShowSpotlight] = useState(false);

  // Controls State
  const [switchEnabled, setSwitchEnabled] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState(0);
  const [sliderValue, setSliderValue] = useState(50);
  const [stepperValue, setStepperValue] = useState(5);

  const tabs = ["Payments", "Search", "Share", "Controls"];
  const schools = ["Twalumbu", "Chimilute", "Julani", "Crested Crane", "International Maarif", "ACU"];

  // Demo Functions
  const handleDynamicIslandDemo = (type: 'processing' | 'success' | 'error') => {
    haptics.light();

    if (type === 'processing') {
      dynamicIsland.showProcessing({
        title: 'Processing Payment',
        subtitle: 'Please wait...',
        amount: 'UGX 500,000',
        school: 'Twalumbu Primary',
        progress: 0
      });

      // Simulate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress <= 100) {
          dynamicIsland.show('processing', {
            title: 'Processing Payment',
            subtitle: 'Please wait...',
            amount: 'UGX 500,000',
            school: 'Twalumbu Primary',
            progress
          });
        } else {
          clearInterval(interval);
          setTimeout(() => {
            dynamicIsland.showSuccess({
              title: 'Payment Successful!',
              subtitle: 'Receipt sent',
              amount: 'UGX 500,000',
              school: 'Twalumbu Primary'
            });
          }, 500);
        }
      }, 200);
    } else if (type === 'success') {
      dynamicIsland.showSuccess({
        title: 'Payment Successful!',
        subtitle: 'Receipt sent to your email',
        amount: 'UGX 500,000',
        school: 'Twalumbu Primary'
      });
    } else {
      dynamicIsland.showError({
        title: 'Payment Failed',
        subtitle: 'Insufficient funds',
        amount: 'UGX 500,000',
        school: 'Twalumbu Primary'
      });
    }
  };

  const handleApplePayDemo = () => {
    haptics.light();
    setShowApplePayCard(true);
    setPaymentProcessing(false);
    setPaymentSuccess(false);
  };

  const handleConfirmPayment = () => {
    setPaymentProcessing(true);
    haptics.medium();

    setTimeout(() => {
      setPaymentSuccess(true);
      haptics.success();

      setTimeout(() => {
        setShowApplePayCard(false);
        setPaymentProcessing(false);
        setPaymentSuccess(false);
        toast.success('Payment completed successfully!');
      }, 2500);
    }, 2000);
  };

  const handleSearch = (query: string): SearchResult[] => {
    // Mock search results
    const mockResults: SearchResult[] = [
      {
        id: '1',
        type: 'receipt',
        title: 'Tuition Payment',
        subtitle: 'Twalumbu Primary School',
        meta_data: 'Nov 15, 2025 • 10:30 AM',
        icon: Receipt,
        amount: 'UGX 500,000',
        date: 'Nov 15'
      },
      {
        id: '2',
        type: 'school',
        title: 'Chimilute School',
        subtitle: '15 transactions • Last payment Nov 10',
        icon: School,
        amount: 'UGX 1.2M',
        date: 'Total'
      },
      {
        id: '3',
        type: 'student',
        title: 'John Doe',
        subtitle: 'Grade 5 • Julani Primary',
        icon: User,
        amount: 'UGX 300,000',
        date: 'Nov 12'
      }
    ];

    return mockResults.filter(result =>
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.subtitle?.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handleSelectResult = (result: SearchResult) => {
    toast.success(`Selected: ${result.title}`);
  };

  return (
    <>
      {/* Dynamic Island */}
      <DynamicIsland
        data={dynamicIsland.islandData}
        onDismiss={dynamicIsland.hide}
      />

      {/* Apple Pay Card */}
      <ApplePayCard
        isVisible={showApplePayCard}
        amount="UGX 500,000"
        school="Twalumbu Primary"
        studentName="John Doe"
        services={["Tuition", "School Bus", "Canteen"]}
        onConfirm={handleConfirmPayment}
        onCancel={() => setShowApplePayCard(false)}
        processing={paymentProcessing}
        success={paymentSuccess}
      />

      {/* Share Sheet */}
      <IOSShareSheet
        isVisible={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        receiptId="TXN1732550123456A1B2C3"
        amount="UGX 500,000"
        school="Twalumbu Primary"
        shareData={{
          title: 'Share Payment Receipt',
          description: 'Share this receipt with parents or administrators',
          data: {}
        }}
        dynamicIsland={dynamicIsland}
      />

      {/* Spotlight Search */}
      <SpotlightSearch
        isVisible={showSpotlight}
        onClose={() => setShowSpotlight(false)}
        onSearch={handleSearch}
        onSelectResult={handleSelectResult}
        recentSearches={['Twalumbu', 'November 2025', 'Tuition']}
        trendingSearches={['School fees', 'Canteen payment', 'Transport']}
      />

      {/* Main Demo Page */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
        {/* Header */}
        <div
          className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 0px)' }}
        >
          <div className="px-4 py-4 flex items-center gap-4">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#003630]" />
            </button>
            <div className="flex-1">
              <h1 className="text-[20px] font-semibold text-[#003630]">
                iOS Features
              </h1>
              <p className="text-[13px] text-gray-500">
                Apple-level enhancements
              </p>
            </div>
            <Sparkles className="w-6 h-6 text-[#95e36c]" />
          </div>

          {/* Tabs */}
          <div className="px-4 pb-3">
            <SegmentedControl
              segments={tabs}
              selectedIndex={activeTab}
              onChange={setActiveTab}
              fullWidth
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-6 space-y-6">
          {activeTab === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Dynamic Island */}
              <div className="bg-white rounded-[20px] p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#95e36c] to-[#6bc043] rounded-[12px] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#003630]">Dynamic Island</h3>
                    <p className="text-[13px] text-gray-500">Live payment status</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDynamicIslandDemo('processing')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-[10px] text-[14px] font-medium active:scale-95 transition-transform"
                  >
                    Show Processing
                  </button>
                  <button
                    onClick={() => handleDynamicIslandDemo('success')}
                    className="px-4 py-2 bg-green-500 text-white rounded-[10px] text-[14px] font-medium active:scale-95 transition-transform"
                  >
                    Show Success
                  </button>
                  <button
                    onClick={() => handleDynamicIslandDemo('error')}
                    className="px-4 py-2 bg-red-500 text-white rounded-[10px] text-[14px] font-medium active:scale-95 transition-transform"
                  >
                    Show Error
                  </button>
                </div>
              </div>

              {/* Apple Pay Card */}
              <div className="bg-white rounded-[20px] p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#003630] to-[#004d40] rounded-[12px] flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#003630]">Apple Pay Style</h3>
                    <p className="text-[13px] text-gray-500">3D card flip animation</p>
                  </div>
                </div>
                <button
                  onClick={handleApplePayDemo}
                  className="w-full py-3 bg-gradient-to-r from-[#003630] to-[#004d40] text-white rounded-[12px] font-medium active:scale-98 transition-transform"
                >
                  Show Payment Card
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Spotlight Search */}
              <div className="bg-white rounded-[20px] p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-[12px] flex items-center justify-center">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#003630]">Spotlight Search</h3>
                    <p className="text-[13px] text-gray-500">iOS-style search overlay</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    haptics.light();
                    setShowSpotlight(true);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-[12px] font-medium active:scale-98 transition-transform"
                >
                  Open Search
                </button>
                <p className="text-[12px] text-gray-500 mt-3 text-center">
                  Try searching for "Twalumbu" or "tuition"
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Share Sheet */}
              <div className="bg-white rounded-[20px] p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-[12px] flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#003630]">iOS Share Sheet</h3>
                    <p className="text-[13px] text-gray-500">Native sharing experience</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    haptics.light();
                    setShowShareSheet(true);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-[12px] font-medium active:scale-98 transition-transform"
                >
                  Open Share Sheet
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* iOS Controls */}
              <div className="bg-white rounded-[20px] p-6 shadow-lg space-y-6">
                <h3 className="font-semibold text-[#003630]">iOS Controls</h3>

                {/* Switch */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[15px] text-[#003630] font-medium">Enable Notifications</div>
                    <div className="text-[13px] text-gray-500">Get payment updates</div>
                  </div>
                  <IOSSwitch
                    checked={switchEnabled}
                    onChange={setSwitchEnabled}
                  />
                </div>

                <div className="border-t border-gray-100" />

                {/* Picker */}
                <div>
                  <IOSPicker
                    label="Select School"
                    options={schools}
                    selectedIndex={selectedSchool}
                    onChange={setSelectedSchool}
                  />
                </div>

                <div className="border-t border-gray-100" />

                {/* Slider */}
                <div>
                  <IOSSlider
                    label="Payment Amount"
                    value={sliderValue}
                    onChange={setSliderValue}
                    min={0}
                    max={100}
                    showValue
                  />
                </div>

                <div className="border-t border-gray-100" />

                {/* Stepper */}
                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-[#003630]">Number of Students</span>
                  <IOSStepper
                    value={stepperValue}
                    onChange={setStepperValue}
                    min={1}
                    max={10}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Info Card */}
          <div className="bg-gradient-to-br from-[#95e36c]/10 to-[#6bc043]/5 rounded-[20px] p-6 border border-[#95e36c]/20">
            <h4 className="font-semibold text-[#003630] mb-2">
              🍎 iOS 16+ Features
            </h4>
            <p className="text-[14px] text-gray-700">
              Experience Dynamic Island, Apple Pay-style animations, Spotlight Search,
              iOS Share Sheet, and native controls - all working together in Master-Fees!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
