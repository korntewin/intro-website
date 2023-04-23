import Link from "next/link";
import Image from "next/image";
import NavItem from "./navitem.component";
import { assetPrefix } from "@/pages";

type Props = {
    addClass: string;
}


function NavBar({ addClass }: Props) {

    return (
        <div className={`bg-gradient-to-r from-green-400 to-blue-500 drop-shadow ${addClass}`}>
            <nav className="flex">
                <Link href="/" className="md:flex ml-4 mt-3 mb-3 hover:bg-green-300 hover:font-bold rounded-xl">
                    <Image
                        src={`${assetPrefix}/logo.jpg`}
                        alt="Logo"
                        width={50}
                        height={50}
                    />
                </Link>
                <NavItem />
            </nav>
        </div>
    )

}


export default NavBar;