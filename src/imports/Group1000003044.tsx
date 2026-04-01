import svgPaths from "./svg-avv0fbp9bl";
import clsx from "clsx";
type Frame1Props = {
  additionalClassNames?: string;
};

function Frame1({ additionalClassNames = "" }: Frame1Props) {
  return (
    <div className={clsx("absolute h-[251.986px] top-[167.99px] w-[392.328px]", additionalClassNames)}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 392.328 251.986">
        <g clipPath="url(#clip0_232_158)" id="Frame44">
          <path d={svgPaths.p392fbd00} fill="var(--fill-0, #95E36C)" id="Vector" opacity="0.3" />
        </g>
        <defs>
          <clipPath id="clip0_232_158">
            <rect fill="white" height="251.986" width="392.328" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}
type FrameProps = {
  additionalClassNames?: string;
};

function Frame({ additionalClassNames = "" }: FrameProps) {
  return (
    <div className={clsx("absolute h-[230.968px] w-[392.328px]", additionalClassNames)}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 392.328 230.968">
        <g clipPath="url(#clip0_232_155)" id="Frame44">
          <path d={svgPaths.p5e9e700} fill="var(--fill-0, #003630)" id="Vector" opacity="0.35" />
        </g>
        <defs>
          <clipPath id="clip0_232_155">
            <rect fill="white" height="230.968" width="392.328" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container() {
  return (
    <div className="h-[420px] opacity-[0.18] relative shrink-0 w-[392px]" data-name="Container">
      <Frame additionalClassNames="left-[-0.5px] top-[210px]" />
      <Frame additionalClassNames="left-[-409.87px] top-[-185.01px]" />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute left-[142px] size-[109.79px] top-[176px]">
      <div className="absolute inset-[-5.02%_-8.67%_-12.31%_-8.67%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 128.819 128.819">
          <g id="Group 15">
            <g filter="url(#filter0_d_232_171)" id="rect84">
              <path d={svgPaths.p3c984100} fill="var(--fill-0, #003630)" />
              <path d={svgPaths.p38a7c180} stroke="var(--stroke-0, white)" strokeWidth="8" />
            </g>
            <path d={svgPaths.p32912680} id="path60" stroke="var(--stroke-0, #95E36C)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="10" />
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="128.819" id="filter0_d_232_171" width="128.819" x="0" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset dy="4" />
              <feGaussianBlur stdDeviation="2" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_232_171" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_232_171" mode="normal" result="shape" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="absolute bg-[#f5f4f7] content-stretch flex flex-col gap-[20px] h-[852px] items-center justify-end left-[-5px] px-0 py-[24px] top-[-5px] w-[393px]">
      <div aria-hidden="true" className="absolute border-[#95e36c] border-[0px_0px_4px] border-solid inset-0 pointer-events-none" />
      <Container />
      <Group />
      <p className="absolute font-['IBM_Plex_Sans:SemiBold',sans-serif] h-[45px] leading-[45px] left-[196.5px] not-italic text-[48px] text-black text-center top-[397px] translate-x-[-50%] w-[393px]">master-fees</p>
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute h-[198px] left-[-5px] opacity-30 top-[649px] w-[392px]" data-name="Container">
      <Frame1 additionalClassNames="left-0" />
      <Frame1 additionalClassNames="left-[392.33px]" />
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="absolute bg-white border-[#95e36c] border-[5px] border-solid h-[852px] left-[2px] overflow-clip shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] top-0 w-[393px]" data-name="Splash Screen">
      <Frame4 />
      <Container1 />
      <div className="absolute font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] leading-[28px] left-[187px] not-italic text-[24px] text-[rgba(0,0,0,0.59)] text-center top-[317px] translate-x-[-50%] w-[286px]">
        <p className="mb-0">Parent</p>
        <p>Registration Portal</p>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-[2px] top-0">
      <SplashScreen />
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute contents left-[2px] top-0">
      <Group1 />
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute contents left-[2px] top-0">
      <Group2 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="absolute inset-[37.42%_0.08%_-0.01%_0]" data-name="Frame44">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 392 184">
        <g id="Frame44">
          <path d={svgPaths.p14a73700} fill="var(--fill-0, #003630)" fillOpacity="0.28" id="Vector" opacity="0.5" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="absolute bg-[#003630] content-stretch flex gap-[8px] inset-[5.78%_12.06%_75.51%_12.23%] items-center justify-center overflow-clip px-[24px] py-[10px] rounded-[12px] shadow-[0px_6px_0px_0px_rgba(0,54,48,0.25)]" data-name="Button">
      <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[16px] text-nowrap text-white tracking-[-0.16px]">Proceed</p>
    </div>
  );
}

function Frame3() {
  return (
    <div className="absolute h-[293.971px] left-0 overflow-clip top-[552px] w-[392.328px]" data-name="Frame44">
      <div className="absolute inset-[49%_0_0_0]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 392.328 149.931">
          <path d={svgPaths.p2ae7b400} fill="var(--fill-0, #003630)" fillOpacity="0.28" id="Vector" opacity="0.5" />
        </svg>
      </div>
      <Frame2 />
      <div className="absolute inset-[44.22%_0_-4.84%_0]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 392.328 178.213">
          <path d={svgPaths.p3511a600} fill="var(--fill-0, #95E36C)" fillOpacity="0.54" id="Vector" opacity="0.4" />
        </svg>
      </div>
      <Button />
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents left-0 top-[552px]">
      <Frame3 />
    </div>
  );
}

function Group5() {
  return (
    <div className="absolute contents left-0 top-[552px]">
      <Group3 />
    </div>
  );
}

function Group6() {
  return (
    <div className="absolute contents left-0 top-0">
      <Group4 />
      <Group5 />
    </div>
  );
}

export default function Group7() {
  return (
    <div className="relative size-full">
      <Group6 />
    </div>
  );
}