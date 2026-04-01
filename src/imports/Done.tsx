import svgPaths from "./svg-6d9pc8dvdi";

function WarningCircleCheck() {
  return (
    <div className="absolute left-1/2 size-[147px] top-[279px] translate-x-[-50%]" data-name="Warning / Circle_Check">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 147 147">
        <g id="Warning / Circle_Check">
          <path d={svgPaths.pfd993f0} id="Vector" stroke="var(--stroke-0, #95E36C)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" />
        </g>
      </svg>
    </div>
  );
}

function IconRight() {
  return (
    <div className="absolute left-0 size-[24px] top-0" data-name="Icon Right">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon Right">
          <path d={svgPaths.p9206b00} fill="var(--fill-0, white)" id="Shape" />
        </g>
      </svg>
    </div>
  );
}

function IconRightWrapper() {
  return (
    <div className="h-[24px] relative shrink-0 w-[16px]" data-name="Icon Right Wrapper">
      <IconRight />
    </div>
  );
}

function Button() {
  return (
    <div className="absolute bg-[#003630] content-stretch flex gap-[8px] h-[59px] items-center justify-center left-[46px] overflow-clip px-[24px] py-[10px] rounded-[6px] top-[484px] w-[308px]" data-name="Button">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[24px] not-italic relative shrink-0 text-[18px] text-nowrap text-white tracking-[-0.18px]">{`Pay for School Fee's `}</p>
      <IconRightWrapper />
    </div>
  );
}

export default function Done() {
  return (
    <div className="bg-white relative size-full" data-name="Done">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-[200px] not-italic text-[16px] text-black text-center top-[432px] tracking-[-0.16px] translate-x-[-50%] w-[314px]">{`Registration Successful `}</p>
      <WarningCircleCheck />
      <Button />
    </div>
  );
}