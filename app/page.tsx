import ReaderApp from "@/components/reader-app";

export default async function Home({ searchParams }: {
  searchParams: Promise<{ book?: string | string[] }>;
}) {
  const params = await searchParams;
  const bookId = Array.isArray(params.book) ? params.book[0] : params.book;
  return <ReaderApp initialBookId={bookId ?? null} />;
}
