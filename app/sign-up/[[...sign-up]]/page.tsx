import { SignUp } from "@clerk/nextjs";

const SignUpPage = () => {
  return (
    <div className="px-4 py-9 sm:py-12 lg:py-16 max-w-7xl mx-auto flex justify-center items-center ">
      <SignUp signInFallbackRedirectUrl={"/subscribe"} />
    </div>
  );
};

export default SignUpPage;
