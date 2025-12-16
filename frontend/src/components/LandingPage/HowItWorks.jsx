function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Create Your Profile",
      description:
        "Sign up and list the skills you can teach and want to learn. Add certifications and set your availability.",
      icon: "/assets/howitworks/1.svg",
    },
    {
      number: 2,
      title: "Get Matched by AI",
      description:
        "Our intelligent system finds the perfect learning partners based on your goals, schedule, and preferences.",
      icon: "/assets/howitworks/2.svg",
    },
    {
      number: 3,
      title: "Start Learning",
      description:
        "Schedule sessions, connect via chat or video, and exchange knowledge using our credit-based system.",
      icon: "/assets/howitworks/3.svg",
    },
    {
      number: 4,
      title: "Rate & Grow",
      description:
        "Leave feedback, and build your reputation as both a learner and mentor.",
      icon: "/assets/howitworks/4.svg",
    },
  ];

  return (
    <section className="py-20 bg-light-bg font-family-poppins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-medium text-black mb-4">
            How SkillBridge Works
          </h2>
          <p className="text-lg font-medium text-black max-w-xl mx-auto">
            Four simple steps to start your skill exchange journey.
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-2xl">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-6">
              {/* Left side - Icon with vertical line */}
              <div className="flex flex-col items-center">
                {/* Icon Circle */}
                <div className="w-16 h-16 bg-dark-blue rounded-full flex items-center justify-center shrink-0">
                  <img
                    src={step.icon}
                    alt={step.title}
                    className="w-8 h-8"
                  />
                </div>
                {/* Vertical Line */}
                {index < steps.length - 1 && (
                  <div className="w-0.5 flex-1 bg-dark-blue"></div>
                )}
              </div>

              {/* Right side - Content */}
              <div className="flex-1 pb-16">
                <h3 className="text-xl font-medium text-black mb-2">
                  {step.number}. {step.title}
                </h3>
                <p className="text-black font-normal max-w-md leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
