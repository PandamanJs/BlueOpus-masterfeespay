import { useState } from 'react';
import svgPaths from '../imports/svg-izdk2q31w7';
import { AddProductsSheet } from './components/AddProductsSheet';

/**
 * Interface representing a single item in the shopping cart
 */
interface CartItem {
  id: number;
  name: string;
  price: number;
}

/**
 * Interface representing a user's cart with their name and items
 */
interface UserCart {
  name: string;
  items: CartItem[];
}

/**
 * Main App Component - Shopping Cart Application
 * Allows users to manage products/services for multiple users (Shana and Gotham)
 * Features include: user switching, cart management, item deletion, and checkout
 */
export default function App() {
  // State to track which user's cart is currently active
  const [activeUser, setActiveUser] = useState<'shana' | 'gotham'>('shana');

  // State to control the visibility of the Add Products bottom sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // State to store cart data for both users
  const [carts, setCarts] = useState<Record<'shana' | 'gotham', UserCart>>({
    shana: {
      name: 'Shana Siwale',
      items: [
        { id: 1, name: 'School Fees - Term 2', price: 1700.0 },
        { id: 2, name: 'School Fees - Term 2', price: 1700.0 },
        { id: 3, name: 'School Fees - Term 2', price: 1700.0 },
        { id: 4, name: 'School Fees - Term 2', price: 1700.0 },
        { id: 5, name: 'School Fees - Term 2', price: 1700.0 },
      ],
    },
    gotham: {
      name: 'Gotham Siwale',
      items: [],
    },
  });

  // Get the currently active user's cart
  const currentCart = carts[activeUser];

  // Calculate the subtotal by summing all item prices
  const subtotal = currentCart.items.reduce((sum, item) => sum + item.price, 0);

  /**
   * Delete an item from the current user's cart
   * @param id - The unique identifier of the item to delete
   */
  const deleteItem = (id: number) => {
    setCarts({
      ...carts,
      [activeUser]: {
        ...currentCart,
        items: currentCart.items.filter((item) => item.id !== id),
      },
    });
  };

  /**
   * Add multiple items to the current user's cart
   * Automatically assigns unique IDs to new items
   * @param newItems - Array of items to add (without IDs)
   */
  const addItems = (newItems: { name: string; price: number }[]) => {
    // Find the highest existing ID and start from there
    const startId = Math.max(...currentCart.items.map((item) => item.id), 0) + 1;

    // Map new items and assign sequential IDs
    const itemsWithIds = newItems.map((item, index) => ({
      ...item,
      id: startId + index,
    }));

    // Add the new items to the current user's cart
    setCarts({
      ...carts,
      [activeUser]: {
        ...currentCart,
        items: [...currentCart.items, ...itemsWithIds],
      },
    });
  };

  /**
   * Handle checkout action
   * Currently displays an alert with the total amount
   */
  const handleCheckout = () => {
    alert(`Checkout for ${currentCart.name}: K${subtotal.toLocaleString('en-US', { minimumFractionDigits: 1 })}`);
  };

  return (
    <div className="bg-white relative size-full overflow-auto">
      {/* ========== HEADER SECTION ========== */}
      {/* Top navigation bar with back button and branding */}
      <div className="absolute bg-white content-stretch flex h-[80px] items-center left-0 p-[24px] top-0 w-full border-b border-[#e6e6e6]">
        <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-h-px min-w-px">
          {/* Back navigation button */}
          <button className="flex items-center justify-center shrink-0">
            <div className="-scale-y-100 rotate-180 h-[45px] w-[27px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28.3679 45">
                <path d="M20 30L27 22.5L20 15" stroke="black" strokeWidth="2" />
              </svg>
            </div>
          </button>

          {/* App branding/title */}
          <p className="flex-[1_0_0] font-['Space_Grotesk',sans-serif] font-bold h-[30px] leading-[normal] text-[20px] text-black text-center">
            masterfees
          </p>

          {/* Spacer to balance layout */}
          <div className="shrink-0 size-[24px]" />
        </div>
      </div>

      {/* ========== TITLE SECTION ========== */}
      {/* Page title and description with shopping bag icon */}
      <div className="absolute bg-[#f9fafb] content-stretch flex flex-col h-[104px] left-0 p-[24px] top-[80px] w-full">
        {/* Title with icon */}
        <div className="content-stretch flex gap-[10px] items-center">
          {/* Shopping bag icon */}
          <div className="relative shrink-0 size-[20px]">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
              <path d={svgPaths.p3eb9a900} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              <path d="M2.58583 5.02833H17.4142" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              <path d={svgPaths.pc159980} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Page title */}
          <p className="flex-[1_0_0] font-['Inter',sans-serif] font-bold leading-[normal] text-[20px] text-black">
            Products/Services Cart
          </p>
        </div>

        {/* Instructional description text */}
        <div className="content-stretch flex items-center justify-center py-[6px] rounded-[6px] w-full">
          <p className="flex-[1_0_0] font-['Inter',sans-serif] font-normal leading-[normal] text-[12px] text-black">
            Add the products and services you would like to pay for and proceed to checkout.
          </p>
        </div>
      </div>

      {/* ========== USER TABS SECTION ========== */}
      {/* Toggle between different user carts (Shana and Gotham) */}
      <div className="absolute content-stretch flex gap-[16px] h-[50px] items-center left-[24px] top-[203px] right-[24px]">
        {/* Shana Siwale tab button */}
        <button
          onClick={() => setActiveUser('shana')}
          className={`h-full rounded-[12px] transition-colors ${
            activeUser === 'shana'
              ? 'bg-[#f3fcf0] border border-[#def8d5]' // Active state styling
              : 'hover:bg-gray-50' // Inactive hover state
          }`}
        >
          <div className="content-stretch flex gap-[10px] h-full items-center justify-center px-[25px] py-[4px]">
            {/* Green indicator dot shown when active */}
            {activeUser === 'shana' && (
              <div className="relative shrink-0 size-[6px]">
                <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
                  <circle cx="3" cy="3" fill="#4FE501" r="3" />
                </svg>
              </div>
            )}
            <p className="font-['Space_Grotesk',sans-serif] font-bold text-[12px] text-black whitespace-nowrap">
              Shana Siwale
            </p>
          </div>
        </button>

        {/* Gotham Siwale tab button */}
        <button
          onClick={() => setActiveUser('gotham')}
          className={`h-full rounded-[12px] transition-colors ${
            activeUser === 'gotham'
              ? 'bg-[#f3fcf0] border border-[#def8d5]' // Active state styling
              : 'hover:bg-gray-50' // Inactive hover state
          }`}
        >
          <div className="content-stretch flex h-full items-center justify-center px-[12px] py-[4px]">
            {/* Green indicator dot shown when active */}
            {activeUser === 'gotham' && (
              <div className="relative shrink-0 size-[6px] mr-[10px]">
                <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
                  <circle cx="3" cy="3" fill="#4FE501" r="3" />
                </svg>
              </div>
            )}
            <p className="font-['Space_Grotesk',sans-serif] font-medium text-[12px] text-[#2d2d2d] whitespace-nowrap">
              Gotham Siwale
            </p>
          </div>
        </button>
      </div>

      {/* ========== CART ITEMS LIST ========== */}
      {/* Dynamically rendered list of items in the current user's cart */}
      <div className="absolute content-stretch flex flex-col gap-[6px] items-start left-[24px] right-[24px] top-[282px]">
        {currentCart.items.map((item, index) => (
          <div key={item.id}>
            {/* Individual cart item card */}
            <div className="bg-white content-stretch flex flex-col items-start py-[12px] rounded-[16px] w-full">
              <div className="content-stretch flex gap-[10px] items-start justify-end w-full">
                {/* Item number/index (1-based) */}
                <div className="content-stretch flex flex-col items-center pb-[10px] pt-[2px] px-[10px] shrink-0 w-[31px]">
                  <p className="font-['Inter',sans-serif] font-normal leading-[normal] text-[12px] text-black text-center w-full">
                    {index + 1}.
                  </p>
                </div>

                {/* Item name/description */}
                <div className="content-stretch flex flex-col items-start py-px shrink-0 w-[121px]">
                  <p className="font-['Inter',sans-serif] font-normal leading-[normal] text-[12px] text-black whitespace-nowrap">
                    {item.name}
                  </p>
                </div>

                {/* Item price and delete button */}
                <div className="content-stretch flex flex-[1_0_0] gap-[16px] items-start justify-end">
                  {/* Item price display */}
                  <div className="content-stretch flex flex-col items-end pb-[10px] px-[10px] shrink-0 w-[68px]">
                    <p className="font-['Inter',sans-serif] font-normal leading-[normal] text-[12px] text-black text-center w-full">
                      K{item.price.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                    </p>
                  </div>

                  {/* Delete/trash button */}
                  <button onClick={() => deleteItem(item.id)} className="shrink-0 size-[16px] hover:opacity-70 transition-opacity">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                      <path d="M6.66667 7.33333V11.3333" stroke="#AEAEAE" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      <path d="M9.33333 7.33333V11.3333" stroke="#AEAEAE" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      <path d={svgPaths.p37e28100} stroke="#AEAEAE" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      <path d="M2 4H14" stroke="#AEAEAE" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      <path d={svgPaths.p27b6a800} stroke="#AEAEAE" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Dashed divider line between items (not shown after last item) */}
            {index < currentCart.items.length - 1 && (
              <div className="h-0 w-full">
                <svg className="block w-full h-[1px]" fill="none" preserveAspectRatio="none" viewBox="0 0 392 1">
                  <line stroke="#E0E0E0" strokeDasharray="4 4" x2="392" y1="0.5" y2="0.5" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ========== SUBTOTAL SECTION ========== */}
      {/* Horizontal divider line above subtotal */}
      <div
        className="absolute content-stretch flex gap-[10px] items-center left-[24px] right-[24px]"
        style={{ top: `${282 + currentCart.items.length * 50 + (currentCart.items.length - 1) * 6 + 126}px` }}
      >
        <div className="h-0 w-full mb-[24px]">
          <svg className="block w-full h-[1px]" fill="none" preserveAspectRatio="none" viewBox="0 0 392 1">
            <line stroke="#DCDBDB" x2="392" y1="0.5" y2="0.5" />
          </svg>
        </div>
      </div>

      {/* Subtotal label and calculated amount */}
      {/* Position dynamically calculated based on number of items in cart */}
      <div
        className="absolute content-stretch flex gap-[10px] items-center left-[24px] right-[24px]"
        style={{ top: `${282 + currentCart.items.length * 50 + (currentCart.items.length - 1) * 6 + 136}px` }}
      >
        {/* "Subtotal" label */}
        <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-center">
          <p className="font-['Inter',sans-serif] font-bold leading-[normal] text-[16px] text-black whitespace-nowrap">
            Subtotal
          </p>
        </div>

        {/* Calculated subtotal amount */}
        <div className="content-stretch flex flex-col items-end justify-center p-[10px] shrink-0 w-[74px]">
          <p className="font-['Inter',sans-serif] font-bold leading-[normal] text-[16px] text-black text-center w-full">
            K{subtotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* ========== ADD PRODUCTS BUTTON ========== */}
      {/* Button to open the bottom sheet for adding new products/services */}
      {/* Position dynamically calculated to appear below the cart items */}
      <div
        className="absolute bg-[#f9fafb] content-stretch flex h-[60px] items-center left-[22px] right-[22px] px-[24px] py-[10px] rounded-[12px] border border-[#f2f2f2]"
        style={{ top: `${282 + currentCart.items.length * 50 + (currentCart.items.length - 1) * 6 + 199}px` }}
      >
        {/* Button triggers the add products bottom sheet */}
        <button onClick={() => setIsSheetOpen(true)} className="content-stretch flex flex-[1_0_0] gap-[6px] items-center justify-center hover:opacity-80 transition-opacity">
          {/* Plus icon in circle */}
          <div className="content-stretch flex items-center justify-end shrink-0">
            <div className="relative shrink-0 size-[16px]">
              <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                <path d={svgPaths.p39ee6532} stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5.33333 8H10.6667" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 5.33333V10.6667" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Button label text */}
          <p className="font-['Inter',sans-serif] font-medium leading-[normal] text-[12px] text-black whitespace-nowrap">
            Add Products/Services
          </p>
        </button>
      </div>

      {/* ========== CHECKOUT SECTION ========== */}
      {/* Sticky checkout bar with grand total and checkout button */}
      {/* Position dynamically calculated to appear below the Add Products button */}
      <div
        className="absolute bg-white content-stretch flex gap-[12px] h-[75px] items-center left-[22px] right-[22px] p-[12px] rounded-[12px] border border-[#dfdfdf] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
        style={{ top: `${282 + currentCart.items.length * 50 + (currentCart.items.length - 1) * 6 + 272}px` }}
      >
        {/* Grand Total Display Section */}
        <div className="content-stretch flex gap-[4px] items-center shrink-0 w-[178px]">
          {/* Shopping bag icon */}
          <div className="relative shrink-0 size-[20px]">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
              <path d={svgPaths.p3eb9a900} stroke="#003129" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              <path d="M2.58583 5.02833H17.4142" stroke="#003129" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              <path d={svgPaths.pc159980} stroke="#003129" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Total amount and label */}
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start justify-center">
            {/* Grand total amount */}
            <div className="content-stretch flex flex-col items-end justify-center px-[10px] w-[111px]">
              <p className="font-['Inter',sans-serif] font-black leading-[normal] text-[20px] text-black text-center w-full">
                K{subtotal.toLocaleString('en-US', { minimumFractionDigits: 1 })}
              </p>
            </div>

            {/* "GRAND TOTAL" label */}
            <div className="content-stretch flex items-center justify-center px-[10px]">
              <p className="font-['Inter',sans-serif] font-medium leading-[normal] text-[#a0a0a0] text-[8px] whitespace-nowrap">
                GRAND TOTAL
              </p>
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          className="bg-[#003129] flex-[1_0_0] h-full rounded-[12px] hover:opacity-90 transition-opacity"
        >
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex items-center pl-[24px] pr-[12px] py-[10px] size-full">
              <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center justify-center">
                {/* Checkout text */}
                <p className="flex-[1_0_0] font-['Inter',sans-serif] font-bold leading-[normal] text-[12px] text-center text-white">
                  Checkout
                </p>

                {/* Arrow icon */}
                <div className="content-stretch flex items-center justify-end shrink-0">
                  <div className="relative shrink-0 size-[16px]">
                    <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                      <path d="M6 12L10 8L6 4" stroke="#8FF957" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* ========== ADD PRODUCTS BOTTOM SHEET ========== */}
      {/* Modal sheet component for adding products/services to cart */}
      <AddProductsSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} onAdd={addItems} />
    </div>
  );
}