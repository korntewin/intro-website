import { companies } from "..";
import SideBar from "@/components/sidebar/sidebar.component";
import NavBar from "@/components/navbar/v2/navbar.component";


function Experience() {

    const ls = [...Array(100)];

    return (
        <div className="bg-gradient-to-r from-green-400 to-blue-500 brightness-95" >
            <NavBar addClass="z-40 sticky top-0" />
            <div className="md:flex flex-row">
                <SideBar ls={companies} />
                <div className="h-screen px-2 py-5">
                    WIP
                </div>
            </div>
        </div>
    )

}


export default Experience;