import Navbar from "@/components/ComponentsUserPage/Navbar";
import { Sidebar } from "@/components/ComponentsUserPage/MainSideBar";

const UserIdLayout = async ({
  children,
}: {
  children: React.ReactNode;
  params: { userId: number };
}) => {
  return (
    <>
      <Navbar />
      <main className="h-screen px-4 pt-20">
        <div className="flex gap-x-7">
          <div className="hidden w-64 shrink-0 md:block">
            <Sidebar />
          </div>
          {children}
        </div>
      </main>
    </>
  );
};

export default UserIdLayout;
