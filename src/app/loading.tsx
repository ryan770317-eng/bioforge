export default function Loading() {
  return (
    <div className="fixed inset-0 bg-[#FFF8F0] flex flex-col items-center justify-center gap-5">
      <p className="text-2xl font-bold tracking-widest text-[#D4A24E]">BioForge</p>
      <div
        className="w-8 h-8 rounded-full animate-spin"
        style={{
          border: "3px solid #F5E6CC",
          borderTopColor: "#D4A24E",
        }}
      />
    </div>
  );
}
