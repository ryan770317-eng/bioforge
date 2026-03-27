export default function Loading() {
  return (
    <div className="fixed inset-0 bg-[#ebebeb] flex flex-col items-center justify-center gap-5">
      <p className="text-2xl font-bold tracking-widest text-[#1a1a1a]">BioHACKING</p>
      <div
        className="w-8 h-8 rounded-full animate-spin"
        style={{
          border: "3px solid #F5E6CC",
          borderTopColor: "#e9f955",
        }}
      />
    </div>
  );
}
