import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';

function LegalLayout({ title, lastUpdated, children }) {
  return (
    <div className="min-h-screen bg-light-bg flex flex-col">
      <Header />
      <main className="grow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-family-poppins text-2xl font-bold text-black mb-1">
            {title}
          </h1>
          <p className="font-family-poppins text-sm text-gray mb-8">
            Last updated: {lastUpdated}
          </p>
          <div className="font-family-poppins text-sm text-black space-y-6 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-black [&_h2]:mt-8 [&_h2]:mb-2 [&_p]:text-black [&_p]:leading-relaxed [&_li]:text-black [&_li]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-teal [&_a]:hover:underline">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default LegalLayout;
