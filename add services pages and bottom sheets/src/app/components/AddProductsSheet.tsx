import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import svgPaths from '../../imports/svg-0a5u6qlzm6';

/**
 * Props interface for AddProductsSheet component
 */
interface AddProductsSheetProps {
  isOpen: boolean; // Controls visibility of the bottom sheet
  onClose: () => void; // Callback when sheet is closed
  onAdd: (items: { name: string; price: number }[]) => void; // Callback when items are added to cart
}

/**
 * Type definition for product/service categories
 */
type Category = 'school-fees' | 'transport' | 'cafeteria' | 'uniforms';

/**
 * Available categories for products/services
 * Each category has an ID, display label, and item count badge
 */
const categories = [
  { id: 'school-fees' as Category, label: 'School Fees', count: 1 },
  { id: 'transport' as Category, label: 'Transport', count: 0 },
  { id: 'cafeteria' as Category, label: 'Cafeteria', count: 0 },
  { id: 'uniforms' as Category, label: 'Uniforms', count: 0 },
];

/**
 * Available grade options with their corresponding prices
 */
const grades = [
  { label: 'Grade 5 (Upper primary)', price: 2000 },
  { label: 'Grade 6 (Upper primary)', price: 2200 },
  { label: 'Grade 7 (Lower secondary)', price: 2400 },
];

/**
 * Available academic years for selection
 */
const years = ['2024', '2025', '2026'];

/**
 * Available term periods for school fees
 */
const terms = ['Term 1', 'Term 2', 'Term 3'];

/**
 * AddProductsSheet Component
 * A bottom sheet modal for adding products/services to the cart
 * Features category selection, grade/year dropdowns, and term checkboxes
 */
export function AddProductsSheet({ isOpen, onClose, onAdd }: AddProductsSheetProps) {
  // State for currently selected category (school-fees, transport, etc.)
  const [activeCategory, setActiveCategory] = useState<Category>('school-fees');

  // State for selected grade index (maps to grades array)
  const [selectedGrade, setSelectedGrade] = useState(0);

  // State for selected year index (maps to years array, defaults to 2026)
  const [selectedYear, setSelectedYear] = useState(2);

  // State for selected terms as boolean array [Term 1, Term 2, Term 3]
  const [selectedTerms, setSelectedTerms] = useState<boolean[]>([false, false, false]);

  // State to control grade dropdown visibility
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);

  // State to control academic year dropdown visibility
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  /**
   * Toggle the selection state of a specific term
   * @param index - Index of the term to toggle (0-2)
   */
  const toggleTerm = (index: number) => {
    const newTerms = [...selectedTerms];
    newTerms[index] = !newTerms[index];
    setSelectedTerms(newTerms);
  };

  // Calculate how many terms are currently selected
  const selectedCount = selectedTerms.filter(Boolean).length;

  // Calculate subtotal based on selected terms and grade price
  const subtotal = selectedCount * grades[selectedGrade].price;

  /**
   * Handle adding selected items to the cart
   * Creates an array of items based on selected terms and triggers onAdd callback
   * Resets term selection and closes the sheet after adding
   */
  const handleAdd = () => {
    const items: { name: string; price: number }[] = [];

    // Build array of items from selected terms
    selectedTerms.forEach((selected, index) => {
      if (selected) {
        items.push({
          name: `School Fees - ${terms[index]}`,
          price: grades[selectedGrade].price,
        });
      }
    });

    // Add items to cart via callback
    onAdd(items);

    // Reset selections and close sheet
    setSelectedTerms([false, false, false]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ========== BACKDROP OVERLAY ========== */}
          {/* Semi-transparent overlay that covers the screen behind the sheet */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* ========== BOTTOM SHEET CONTAINER ========== */}
          {/* Animated sliding sheet that comes up from the bottom */}
          <motion.div
            initial={{ y: '100%' }} // Start below screen
            animate={{ y: 0 }} // Slide to visible position
            exit={{ y: '100%' }} // Slide back down when closing
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-tl-[16px] rounded-tr-[16px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] z-50 max-w-[440px] mx-auto"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="relative pb-[24px]">
              {/* ========== HEADER SECTION ========== */}
              {/* Sheet header with title and close button */}
              <div className="content-stretch flex gap-[10px] h-[28px] items-center px-[16px] mt-[24px]">
                {/* Title with plus icon */}
                <div className="content-stretch flex flex-[1_0_0] gap-[6px] items-center">
                  {/* Plus circle icon */}
                  <div className="relative shrink-0 size-[16px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                      <path d={svgPaths.p39ee6532} stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5.33333 8H10.6667" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 5.33333V10.6667" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  {/* Sheet title */}
                  <p className="font-['Inter',sans-serif] font-bold leading-[normal] text-[12px] text-black whitespace-nowrap">
                    Add Products/Services
                  </p>
                </div>

                {/* Close button with X icon */}
                <button onClick={onClose} className="relative shrink-0 size-[28px]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 36 36">
                    <rect fill="white" height="28" rx="14" width="28" x="4" y="2" />
                    <rect height="27" rx="13.5" stroke="#EDEDED" width="27" x="4.5" y="2.5" />
                    <path d={svgPaths.p32b50300} stroke="#505050" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </button>
              </div>

              {/* Horizontal divider line */}
              <div className="h-0 mt-[20px] mb-[20px]">
                <svg className="block w-full h-[1px]" fill="none" preserveAspectRatio="none" viewBox="0 0 440 1">
                  <line stroke="#E3E6E8" x2="440" y1="0.5" y2="0.5" />
                </svg>
              </div>

              {/* ========== CATEGORY TABS ========== */}
              {/* Pill-style tabs for switching between product categories */}
              <div className="px-[16px]">
                <div className="bg-[#fafafa] border-[0.5px] border-[#e6e6e6] rounded-[60px] p-[8px] shadow-[inset_0px_4px_4px_0px_rgba(0,0,0,0.1)]">
                  <div className="content-stretch flex items-center">
                    {/* Map through all available categories */}
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`flex-[1_0_0] rounded-[60px] px-[16px] py-[12px] transition-all ${
                          activeCategory === category.id
                            ? 'bg-white shadow-[0px_2px_4px_0px_rgba(0,0,0,0.15)] border-[0.5px] border-[#d9d9d9]' // Active tab styling
                            : '' // Inactive tab (transparent)
                        }`}
                      >
                        <div className="flex gap-[4px] items-center justify-center">
                          {/* Badge showing item count (only shown when active and count > 0) */}
                          {activeCategory === category.id && category.count > 0 && (
                            <div className="bg-[#e0f7d4] border-[0.5px] border-[#003129] rounded-[50px] size-[16px] flex items-center justify-center">
                              <p className="font-['Inter',sans-serif] font-bold text-[8px] text-[#003129]">
                                {category.count}
                              </p>
                            </div>
                          )}

                          {/* Category label text */}
                          <p
                            className={`font-['Inter',sans-serif] text-[12px] whitespace-nowrap ${
                              activeCategory === category.id
                                ? 'font-bold text-black' // Active text styling
                                : 'font-normal text-[#686868]' // Inactive text styling
                            }`}
                          >
                            {category.label}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ========== GRADE SELECTOR DROPDOWN ========== */}
              {/* Dropdown for selecting school grade level and its price */}
              <div className="px-[16px] mt-[20px]">
                {/* Field label */}
                <p className="font-['Inter',sans-serif] font-bold text-[12px] text-[#808080] mb-[8px]">
                  Select Grade
                </p>

                {/* Dropdown trigger button */}
                <button
                  onClick={() => setGradeDropdownOpen(!gradeDropdownOpen)}
                  className="bg-white border border-[#edecec] rounded-[16px] w-full px-[16px] py-[12px]"
                >
                  <div className="flex gap-[10px] items-center justify-between">
                    {/* Currently selected grade and price */}
                    <p className="font-['Inter',sans-serif] font-medium text-[12px] text-black text-left">
                      {grades[selectedGrade].label} -{' '}
                      <span className="font-bold">K{grades[selectedGrade].price.toLocaleString()}</span>
                    </p>

                    {/* Chevron icon (rotates based on dropdown state) */}
                    <div
                      className={`flex items-center justify-center h-[24px] w-[23px] transition-transform ${
                        gradeDropdownOpen ? 'rotate-180' : 'rotate-90'
                      }`}
                    >
                      <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                        <path d="M6 12L10 8L6 4" stroke="#445552" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Dropdown options (conditionally rendered when open) */}
                {gradeDropdownOpen && (
                  <div className="mt-[4px] bg-white border border-[#edecec] rounded-[16px] overflow-hidden">
                    {grades.map((grade, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedGrade(index);
                          setGradeDropdownOpen(false);
                        }}
                        className="w-full px-[16px] py-[12px] text-left hover:bg-gray-50 transition-colors"
                      >
                        <p className="font-['Inter',sans-serif] font-medium text-[12px] text-black">
                          {grade.label} - <span className="font-bold">K{grade.price.toLocaleString()}</span>
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ========== ACADEMIC YEAR DROPDOWN ========== */}
              {/* Dropdown for selecting the academic year */}
              <div className="px-[16px] mt-[20px]">
                {/* Field label */}
                <p className="font-['Inter',sans-serif] font-bold text-[12px] text-[#808080] mb-[8px]">
                  Academic Year
                </p>

                {/* Dropdown trigger button */}
                <button
                  onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
                  className="bg-white border border-[#edecec] rounded-[16px] w-full px-[16px] py-[12px]"
                >
                  <div className="flex gap-[10px] items-center justify-between">
                    {/* Currently selected year */}
                    <p className="font-['Inter',sans-serif] font-medium text-[12px] text-black text-left">
                      {years[selectedYear]}
                    </p>

                    {/* Chevron icon (rotates based on dropdown state) */}
                    <div
                      className={`flex items-center justify-center h-[24px] w-[23px] transition-transform ${
                        yearDropdownOpen ? 'rotate-180' : 'rotate-90'
                      }`}
                    >
                      <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                        <path d="M6 12L10 8L6 4" stroke="#445552" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Dropdown options (conditionally rendered when open) */}
                {yearDropdownOpen && (
                  <div className="mt-[4px] bg-white border border-[#edecec] rounded-[16px] overflow-hidden">
                    {years.map((year, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedYear(index);
                          setYearDropdownOpen(false);
                        }}
                        className="w-full px-[16px] py-[12px] text-left hover:bg-gray-50 transition-colors"
                      >
                        <p className="font-['Inter',sans-serif] font-medium text-[12px] text-black">{year}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ========== TERMS SELECTION ========== */}
              {/* Checkbox grid for selecting which terms to pay for */}
              <div className="px-[16px] mt-[20px]">
                {/* Section label */}
                <p className="font-['Inter',sans-serif] font-bold text-[12px] text-[#808080] mb-[16px]">
                  Please Select the Periods to pay for
                </p>

                {/* Grid of term checkboxes */}
                <div className="flex gap-[12px]">
                  {terms.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => toggleTerm(index)}
                      className="bg-white border border-[#edecec] rounded-[16px] flex-1 p-[12px]"
                    >
                      <div className="flex gap-[10px] items-center">
                        {/* Custom checkbox */}
                        <div
                          className={`relative rounded-[6px] size-[16px] border border-[#dad8d8] shadow-[inset_0px_4px_4px_0px_rgba(0,0,0,0.05)] transition-colors ${
                            selectedTerms[index] ? 'bg-[#003129]' : 'bg-white' // Dark green when checked
                          }`}
                        >
                          {/* Checkmark icon (shown when selected) */}
                          {selectedTerms[index] && (
                            <svg className="absolute inset-0 size-full p-[2px]" fill="none" viewBox="0 0 12 12">
                              <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            </svg>
                          )}
                        </div>

                        {/* Term label */}
                        <p className="font-['Inter',sans-serif] font-medium text-[12px] text-black whitespace-nowrap">
                          {term}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ========== BOTTOM SECTION ========== */}

              {/* Horizontal divider line */}
              <div className="h-0 mt-[40px] mb-[20px]">
                <svg className="block w-full h-[1px]" fill="none" preserveAspectRatio="none" viewBox="0 0 440 1">
                  <line stroke="#E3E6E8" x2="440" y1="0.5" y2="0.5" />
                </svg>
              </div>

              {/* Subtotal display */}
              <div className="flex gap-[10px] items-center px-[24px] mb-[14px]">
                {/* Subtotal label */}
                <div className="flex-1">
                  <p className="font-['Inter',sans-serif] font-bold text-[16px] text-black">Subtotal</p>
                </div>

                {/* Calculated subtotal amount (selected terms × grade price) */}
                <div className="w-[59px]">
                  <p className="font-['Inter',sans-serif] font-bold text-[16px] text-black text-center">
                    K{subtotal.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* ========== ADD ITEMS BUTTON ========== */}
              {/* Primary action button to add selected items to cart */}
              <div className="px-[16px]">
                <button
                  onClick={handleAdd}
                  disabled={selectedCount === 0} // Disabled when no terms selected
                  className="bg-[#003129] w-full h-[68px] rounded-[12px] flex gap-[10px] items-center justify-center px-[16px] py-[10px] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  {/* Shopping bag icon */}
                  <div className="relative shrink-0 size-[20px]">
                    <svg className="block size-full" fill="none" viewBox="0 0 20 20">
                      <path d={svgPaths.p3eb9a900} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      <path d="M2.58583 5.02833H17.4142" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      <path d={svgPaths.pc159980} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </svg>
                  </div>

                  {/* Button text with dynamic count */}
                  <p className="font-['Inter',sans-serif] font-medium text-[20px] text-white">
                    Add {selectedCount} {selectedCount === 1 ? 'Item' : 'Items'}
                  </p>

                  {/* Checkmark icon */}
                  <div className="relative shrink-0 size-[20px]">
                    <svg className="block size-full" fill="none" viewBox="0 0 20 20">
                      <path d={svgPaths.p32ddfd00} stroke="#8FF957" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
