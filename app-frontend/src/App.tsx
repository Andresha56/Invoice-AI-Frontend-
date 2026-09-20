import Header from "@/componenets/header";
import { LeftPanel } from "@/componenets/left-panel";
import { RightPanel } from "@/componenets/right-panel";

export const App = () => {
  return (
    <>
      <Header />
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-[60%]">
          <LeftPanel />
        </div>

        <div className="w-full md:w-[40%]">
          <RightPanel />
        </div>
      </div>
    </>
  );
};
