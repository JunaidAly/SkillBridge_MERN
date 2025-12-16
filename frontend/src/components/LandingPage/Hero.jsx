import Button from "../../ui/Button";

function Hero() {
  return (
    <section className="max-w-7xl font-family-poppins mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="flex flex-col items-center text-center">
          <h1 className=" text-4xl md:text-5xl font-semibold sm:leading-14 text-black mb-6">
            Exchange Skills, <br />
            <span className="text-teal">Grow Together</span>
          </h1>
          <p className="font-poppins text-lg max-w-sm text-black font-medium mb-8">
            Connect with learners and mentors worldwide. Teach what you know,
            learn what you love, powered by intelligent AI matching and fair
            credit system.
          </p>
          <Button
            variant="herobtn"
            className="px-8 py-3 text-lg font-family-josefin font-semibold"
          >
            Start Learning Free
          </Button>
        </div>

        {/* Right Image */}
        <div className="flex justify-center lg:justify-end">
          <img
            src="/assets/heroimg.png"
            alt="Exchange Skills Illustration"
            className="w-full max-w-lg"
          />
        </div>
      </div>
    </section>
  );
}

export default Hero;
