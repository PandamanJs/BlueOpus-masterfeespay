import svgPaths from "./svg-m3r98bh6uf";
import clsx from "clsx";

function ContainerBackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-[19.992px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">{children}</div>
    </div>
  );
}
type TextBackgroundImage1Props = {
  additionalClassNames?: string;
};

function TextBackgroundImage1({ children, additionalClassNames = "" }: React.PropsWithChildren<TextBackgroundImage1Props>) {
  return (
    <div className={clsx("relative shrink-0", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">{children}</div>
    </div>
  );
}
type TextBackgroundImageProps = {
  additionalClassNames?: string;
};

function TextBackgroundImage({ children, additionalClassNames = "" }: React.PropsWithChildren<TextBackgroundImageProps>) {
  return (
    <div className={clsx("relative shrink-0", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">{children}</div>
    </div>
  );
}

function PaymentPage() {
  return (
    <div className="h-[35.98px] relative shrink-0 w-full" data-name="PaymentPage">
      <p className="absolute font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] leading-[36px] left-0 not-italic text-[#003630] text-[24px] text-nowrap top-[-0.6px] tracking-[-0.528px]">Complete Payment</p>
    </div>
  );
}

function PaymentPage1() {
  return (
    <div className="content-stretch flex h-[21.018px] items-start relative shrink-0 w-full" data-name="PaymentPage">
      <p className="basis-0 font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] grow leading-[21px] min-h-px min-w-px not-italic relative shrink-0 text-[#4a5565] text-[14px] tracking-[-0.176px]">Review your payment and proceed to checkout</p>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col gap-[3.978px] h-[60.976px] items-start relative shrink-0 w-full" data-name="Container">
      <PaymentPage />
      <PaymentPage1 />
    </div>
  );
}

function PaymentPage2() {
  return <div className="absolute h-[294.121px] left-[1.6px] top-[1.6px] w-[349.142px]" data-name="PaymentPage" style={{ backgroundImage: "linear-gradient(113.367deg, rgba(0, 0, 0, 0) 33.394%, rgba(149, 227, 108, 0.15) 50%, rgba(0, 0, 0, 0) 66.606%)" }} />;
}

function Container1() {
  return <div className="absolute h-[441.502px] left-[-164.03px] opacity-40 top-[-137.92px] w-[524.108px]" data-name="Container" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\\'0 0 524.11 441.5\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\' preserveAspectRatio=\\\'none\\\'><rect x=\\\'0\\\' y=\\\'0\\\' height=\\\'100%\\\' width=\\\'100%\\\' fill=\\\'url(%23grad)\\\' opacity=\\\'1\\\'/><defs><radialGradient id=\\\'grad\\\' gradientUnits=\\\'userSpaceOnUse\\\' cx=\\\'0\\\' cy=\\\'0\\\' r=\\\'10\\\' gradientTransform=\\\'matrix(0 -34.264 -34.264 0 262.05 220.75)\\\'><stop stop-color=\\\'rgba(149,227,108,0.25)\\\' offset=\\\'0\\\'/><stop stop-color=\\\'rgba(75,114,54,0.125)\\\' offset=\\\'0.25\\\'/><stop stop-color=\\\'rgba(0,0,0,0)\\\' offset=\\\'0.5\\\'/></radialGradient></defs></svg>')" }} />;
}

function Container2() {
  return (
    <div className="absolute h-[437.093px] left-[-149.28px] top-[-125.5px] w-[518.871px]" data-name="Container">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 519 438">
        <g id="Container" opacity="0.25">
          <rect fill="url(#paint0_radial_224_538)" height="437.093" width="518.871" />
          <path d={svgPaths.p315f4180} id="path60" stroke="var(--stroke-0, #003630)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="19" />
          <path d={svgPaths.p37c6ae80} id="path60_2" stroke="var(--stroke-0, #95E36C)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.77" strokeWidth="17" />
        </g>
        <defs>
          <radialGradient cx="0" cy="0" gradientTransform="translate(259.435 218.546) rotate(-90) scale(339.219 339.219)" gradientUnits="userSpaceOnUse" id="paint0_radial_224_538" r="1">
            <stop stopColor="#003630" stopOpacity="0.2" />
            <stop offset="0.5" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

function PaymentPage3() {
  return <div className="absolute blur-2xl filter left-[1.6px] rounded-[5.37321e+07px] size-[95.98px] top-[199.74px]" data-name="PaymentPage" style={{ backgroundImage: "linear-gradient(45deg, rgba(0, 54, 48, 0.1) 0%, rgba(0, 0, 0, 0) 100%)" }} />;
}

function Text() {
  return (
    <TextBackgroundImage additionalClassNames="h-[21.018px] w-[71.935px]">
      <p className="absolute font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] leading-[21px] left-0 not-italic text-[#364153] text-[14px] top-0 tracking-[-0.176px] w-[92px]">Services (1)</p>
    </TextBackgroundImage>
  );
}

function Text1() {
  return (
    <TextBackgroundImage additionalClassNames="h-[21.018px] w-[49.366px]">
      <p className="absolute font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] leading-[21px] left-0 not-italic text-[#003630] text-[14px] top-0 tracking-[-0.176px] w-[50px]">K 1,000</p>
    </TextBackgroundImage>
  );
}

function Container3() {
  return (
    <div className="h-[21.018px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between relative size-full">
          <Text />
          <Text1 />
        </div>
      </div>
    </div>
  );
}

function Text2() {
  return (
    <TextBackgroundImage1 additionalClassNames="h-[21.018px] w-[103.512px]">
      <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] leading-[21px] not-italic relative shrink-0 text-[#364153] text-[14px] text-nowrap tracking-[-0.176px]">Service Fee (2%)</p>
    </TextBackgroundImage1>
  );
}

function Text3() {
  return (
    <TextBackgroundImage additionalClassNames="h-[21px] w-[42px]">
      <p className="absolute font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] leading-[21px] left-0 not-italic text-[#4a5565] text-[14px] top-[-0.01px] tracking-[-0.176px] w-[58px]">K 20</p>
    </TextBackgroundImage>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex items-center justify-between pb-0 pt-[7px] px-0 relative shrink-0 w-[290px]" data-name="Container">
      <Text2 />
      <Text3 />
    </div>
  );
}

function Paragraph() {
  return (
    <div className="absolute h-[21.018px] left-0 top-[9.58px] w-[301.152px]" data-name="Paragraph">
      <p className="absolute font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] leading-[21px] left-0 not-italic text-[#364153] text-[14px] top-0 tracking-[-0.176px] w-[76px]">Students (1)</p>
    </div>
  );
}

function Text4() {
  return (
    <div className="absolute bg-[rgba(0,54,48,0.1)] h-[25.972px] left-0 rounded-[5.37321e+07px] top-[38.58px] w-[120.151px]" data-name="Text">
      <p className="absolute font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] leading-[18px] left-[11.99px] not-italic text-[#003630] text-[12px] text-nowrap top-[3.98px] tracking-[-0.176px]">Isaiah Kapambwe</p>
    </div>
  );
}

function Container5() {
  return (
    <div className="h-[64.554px] relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[1.601px_0px_0px] border-[rgba(229,231,235,0.5)] border-solid inset-0 pointer-events-none" />
      <Paragraph />
      <Text4 />
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-col gap-[11.985px] h-[131px] items-start relative shrink-0 w-[302px]" data-name="Container">
      <Container3 />
      <Container4 />
      <Container5 />
    </div>
  );
}

function PaymentPage4() {
  return (
    <div className="absolute content-stretch flex flex-col h-[141px] items-start left-[20.01px] top-[149.05px] w-[301px]" data-name="PaymentPage">
      <Container6 />
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="absolute content-stretch flex h-[18.015px] items-start left-[25.01px] top-[65.05px] w-[301.152px]" data-name="Paragraph">
      <p className="basis-0 font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] grow leading-[18px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a7282] text-[12px] text-center tracking-[0.3px] uppercase">Total Payment</p>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="absolute h-[47.99px] left-[25.01px] top-[91.05px] w-[301.152px]" data-name="Paragraph">
      <p className="absolute font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] leading-[48px] left-[150.78px] not-italic text-[#003630] text-[48px] text-center top-[-2.41px] tracking-[-0.176px] translate-x-[-50%] w-[174px]">K 1,020</p>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-[25.01px] top-[65.05px]">
      <Paragraph1 />
      <Paragraph2 />
    </div>
  );
}

function Container7() {
  return (
    <div className="h-[297.324px] relative rounded-[24px] shrink-0 w-full" data-name="Container" style={{ backgroundImage: "linear-gradient(139.841deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%)" }}>
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <PaymentPage2 />
        <Container1 />
        <Container2 />
        <div className="absolute flex h-[84.685px] items-center justify-center left-[219.01px] top-[-7.95px] w-[67.326px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
          <div className="flex-none rotate-[288.797deg]">
            <div className="h-[46px] relative w-[73.8px]" data-name="path60 (Stroke)">
              <div className="absolute inset-[-1.09%_-0.68%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 75 47">
                  <path d={svgPaths.p1411a800} id="path60 (Stroke)" stroke="var(--stroke-0, #003630)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.42" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <PaymentPage3 />
        <PaymentPage4 />
        <Group1 />
      </div>
      <div aria-hidden="true" className="absolute border-[1.601px] border-[rgba(149,227,108,0.42)] border-solid inset-0 pointer-events-none rounded-[24px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]" />
    </div>
  );
}

function Icon() {
  return (
    <div className="h-[19.992px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[8.33%_16.67%]" data-name="Vector">
        <div className="absolute inset-[-5%_-6.25%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 19">
            <path d={svgPaths.p30be1600} id="Vector" stroke="var(--stroke-0, #003630)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66598" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[33.33%]" data-name="Vector">
        <div className="absolute inset-[-12.5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 9">
            <path d={svgPaths.pbd55180} id="Vector" stroke="var(--stroke-0, #003630)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66598" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[27.08%] left-1/2 right-1/2 top-[27.08%]" data-name="Vector">
        <div className="absolute inset-[-9.09%_-0.83px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 11">
            <path d="M0.832989 9.99586V0.832989" id="Vector" stroke="var(--stroke-0, #003630)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66598" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <ContainerBackgroundImage>
      <Icon />
    </ContainerBackgroundImage>
  );
}

function Text5() {
  return (
    <TextBackgroundImage1 additionalClassNames="h-[21.018px] w-[149.425px]">
      <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] leading-[21px] not-italic relative shrink-0 text-[#003630] text-[14px] text-center text-nowrap tracking-[-0.176px]">Services Breakdown (1)</p>
    </TextBackgroundImage1>
  );
}

function Container9() {
  return (
    <div className="h-[21.018px] relative shrink-0 w-[181.402px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[11.985px] items-center relative size-full">
        <Container8 />
        <Text5 />
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="h-[19.992px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute bottom-[37.5%] left-1/4 right-1/4 top-[37.5%]" data-name="Vector">
        <div className="absolute inset-[-16.67%_-8.33%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
            <path d={svgPaths.p8cf3700} id="Vector" stroke="var(--stroke-0, #003630)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66598" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container10() {
  return (
    <ContainerBackgroundImage>
      <Icon1 />
    </ContainerBackgroundImage>
  );
}

function CollapsibleSection() {
  return (
    <div className="bg-[rgba(255,255,255,0.6)] h-[56.197px] relative rounded-[16.4px] shrink-0 w-full" data-name="CollapsibleSection">
      <div aria-hidden="true" className="absolute border-[1.601px] border-[rgba(255,255,255,0.8)] border-solid inset-0 pointer-events-none rounded-[16.4px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[17.589px] py-[1.601px] relative size-full">
          <Container9 />
          <Container10 />
        </div>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex flex-col gap-[23.995px] h-[454.48px] items-start relative shrink-0 w-full" data-name="Container">
      <Container />
      <Container7 />
      <CollapsibleSection />
    </div>
  );
}

function Container12() {
  return (
    <div className="absolute content-stretch flex flex-col h-[787.534px] items-start left-0 overflow-clip pb-0 pt-[23.995px] px-[19.992px] top-[65.98px] w-[392.328px]" data-name="Container">
      <Container11 />
    </div>
  );
}

function Rect() {
  return (
    <div className="absolute contents inset-[6.37%_17.03%_26.89%_14.47%]" data-name="rect84">
      <div className="absolute inset-[6.37%_17.03%_26.89%_14.47%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 26 26">
          <path d={svgPaths.p35389000} fill="var(--fill-0, #003630)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[6.37%_17.03%_26.89%_14.47%]" data-name="Vector">
        <div className="absolute inset-[-5.76%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 29 29">
            <path d={svgPaths.p3303eb00} id="Vector" stroke="var(--stroke-0, white)" strokeWidth="2.92061" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Path() {
  return (
    <div className="absolute contents inset-[20.19%_33.13%_61.54%_30.02%]" data-name="path60">
      <div className="absolute inset-[20.19%_33.13%_61.54%_30.02%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 7">
          <path d={svgPaths.p2780780} fill="var(--fill-0, #003630)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[20.19%_33.13%_61.54%_30.02%]" data-name="Vector">
        <div className="absolute inset-[-28.05%_-14.29%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 11">
            <path d={svgPaths.pc99a400} id="Vector" stroke="var(--stroke-0, #95E36C)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.89415" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents inset-[6.37%_17.03%_26.89%_14.47%]">
      <Rect />
      <Path />
    </div>
  );
}

function Icon2() {
  return (
    <div className="h-[37.982px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Group />
    </div>
  );
}

function Logo() {
  return (
    <div className="absolute content-stretch flex flex-col h-[37.982px] items-start left-[-3px] top-0 w-[36.981px]" data-name="Logo11">
      <Icon2 />
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="absolute h-[29.975px] left-[46.96px] top-[0.5px] w-[110.467px]" data-name="Paragraph">
      <p className="absolute font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] leading-[30px] left-0 not-italic text-[#003630] text-[20px] text-nowrap top-[-0.6px] tracking-[-0.3px]">master-fees</p>
    </div>
  );
}

function Container13() {
  return (
    <div className="h-[30.976px] relative shrink-0 w-full" data-name="Container">
      <Logo />
      <Paragraph3 />
    </div>
  );
}

function Header() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.95)] content-stretch flex flex-col h-[65.98px] items-start left-0 pb-[1.601px] pt-[16.989px] px-[117.448px] top-0 w-[392.328px]" data-name="Header10">
      <div aria-hidden="true" className="absolute border-[#e5e7eb] border-[0px_0px_1.601px] border-solid inset-0 pointer-events-none" />
      <Container13 />
    </div>
  );
}

function PaymentPage5() {
  return (
    <div className="absolute h-[853.514px] left-0 top-0 w-[392.328px]" data-name="PaymentPage" style={{ backgroundImage: "linear-gradient(114.686deg, rgb(255, 255, 255) 0%, rgb(249, 250, 251) 50%, rgba(240, 253, 244, 0.3) 100%)" }}>
      <Container12 />
      <Header />
    </div>
  );
}

function Icon3() {
  return (
    <div className="relative shrink-0 size-[15.988px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_224_516)" id="Icon">
          <path d={svgPaths.p3ff60300} id="Vector" stroke="var(--stroke-0, #4A5565)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33237" />
          <path d={svgPaths.p1a61e180} id="Vector_2" stroke="var(--stroke-0, #4A5565)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33237" />
        </g>
        <defs>
          <clipPath id="clip0_224_516">
            <rect fill="white" height="15.9884" width="15.9884" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text6() {
  return (
    <TextBackgroundImage1 additionalClassNames="h-[18.015px] w-[186.256px]">
      <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] leading-[18px] not-italic relative shrink-0 text-[#4a5565] text-[12px] text-nowrap tracking-[-0.176px]">Secure payment powered by Lenco</p>
    </TextBackgroundImage1>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex gap-[7.982px] h-[18.015px] items-center justify-center relative shrink-0 w-full" data-name="Container">
      <Icon3 />
      <Text6 />
    </div>
  );
}

function Icon4() {
  return (
    <div className="relative shrink-0 size-[19.992px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_224_524)" id="Icon">
          <path d={svgPaths.p3b0f3800} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66598" />
          <path d="M1.66598 8.32987H18.3258" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66598" />
        </g>
        <defs>
          <clipPath id="clip0_224_524">
            <rect fill="white" height="19.9917" width="19.9917" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text7() {
  return (
    <TextBackgroundImage additionalClassNames="h-[23.97px] w-[86.898px]">
      <p className="absolute font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] leading-[24px] left-[30.5px] not-italic text-[20px] text-center text-white top-[-1.6px] tracking-[-0.176px] translate-x-[-50%] w-[87px]">{`Pay `}</p>
    </TextBackgroundImage>
  );
}

function Button() {
  return (
    <div className="bg-[#003630] h-[55.997px] relative rounded-[16.4px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] shrink-0 w-full" data-name="Button">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[11.985px] items-center justify-center pl-0 pr-[0.025px] py-0 relative size-full">
          <Icon4 />
          <Text7 />
        </div>
      </div>
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="content-stretch flex h-[17.89px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="basis-0 font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] grow leading-[17.875px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a7282] text-[11px] text-center tracking-[-0.176px]">{`Clicking "Pay" will open Lenco's secure payment window`}</p>
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex flex-col gap-[15.988px] h-[123.879px] items-start relative shrink-0 w-full" data-name="Container">
      <Container14 />
      <Button />
      <Paragraph4 />
    </div>
  );
}

function PaymentPage6() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.95)] content-stretch flex flex-col h-[165.463px] items-start left-0 pb-0 pt-[21.593px] px-[19.992px] top-[688.05px] w-[392.328px]" data-name="PaymentPage">
      <div aria-hidden="true" className="absolute border-[#e5e7eb] border-[1.601px_0px_0px] border-solid inset-0 pointer-events-none shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]" />
      <Container15 />
    </div>
  );
}

export default function Group2() {
  return (
    <div className="relative size-full">
      <PaymentPage5 />
      <PaymentPage6 />
    </div>
  );
}
