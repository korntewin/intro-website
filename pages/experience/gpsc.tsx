import { companies } from "..";
import SideBar from "@/components/sidebar/sidebar.component";
import NavBar from "@/components/navbar/v2/navbar.component";


function GPSC() {

    const ls = [...Array(10)];

    return (
        <div className="bg-gradient-to-r from-green-400 to-blue-500 brightness-95" >
            <NavBar addClass="z-40 sticky top-0" />
            <div className="md:flex flex-row">
                <SideBar ls={companies} />
                <div className="px-2 py-5">
                    WIP
                </div>
            </div>
        </div>
    )

}


export default GPSC;