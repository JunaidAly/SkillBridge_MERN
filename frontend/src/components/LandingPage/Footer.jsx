function Footer() {
  return (
    <footer className="text-black font-family-poppins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <img
              src="/assets/logo.png"
              alt="SkillBridge Logo"
              className="h-10 mb-4 "
            />
            <p className="text-black max-w-sm  font-light text-sm">
              AI-powered skill exchange platform connecting learners and mentors
              worldwide.
            </p>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-josefin font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-2 font-poppins text-sm">
              <li>
                <a
                  href="#about"
                  className="text-black hover:text-teal transition-colors"
                >
                  About Us
                </a>
              </li>

              <li>
                <a
                  href="#how-it-works"
                  className="text-black hover:text-teal transition-colors"
                >
                  How SkillBridge Works
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
