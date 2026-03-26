export default function ReaderLoading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100dvh",
        gap: 16,
      }}
      className="bg-neutral-50 dark:bg-neutral-950"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-blue-500"
      >
        <path d="M4 11a9 9 0 0 1 9 9" />
        <path d="M4 4a16 16 0 0 1 16 16" />
        <circle cx="5" cy="19" r="1" />
      </svg>
      <span
        style={{ fontSize: 18, fontWeight: 600, fontFamily: "system-ui, -apple-system, sans-serif" }}
        className="text-neutral-900 dark:text-neutral-100"
      >
        Noticias RSS
      </span>
    </div>
  );
}
