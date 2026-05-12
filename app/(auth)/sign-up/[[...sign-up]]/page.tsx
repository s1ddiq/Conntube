import { SignUp } from "@clerk/nextjs";
import React from "react";

const page = () => {
  return (
    <div className="w-full h-screen flex justify-center items-center p-6 md:p-0">
      <SignUp />
    </div>
  );
};

export default page;
