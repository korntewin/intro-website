import NavBar from "@/components/navbar/v2/navbar.component";
import Link from "next/link";
import { assetPrefix } from "..";
import { getSortedPostsData } from "../../lib/utils";


type Props = {
    allPostsData: {
        id: string;
        date: string;
        title: string;
    }[]
}


function Experience({ allPostsData }: Props) {

    return (
        <div className="bg-gradient-to-r from-green-400 to-blue-500 brightness-95" >
            <NavBar addClass="z-40 sticky top-0" />
            <div className="flex flex-col h-screen items-center px-2 py-5">
                {allPostsData.map(({id, date, title}) => (
                    <h1
                    className="text-white font-semibold text-2xl m-3 drop-shadow hover:drop-shadow-2xl
                    cursor-pointer rounded-xl
                    hover:transition-transform transition ease-out delay-150 transform hover:scale-105
                    "
                    key={`${id}-${date}-${title}`}
                    ><Link href={`${assetPrefix}/experience/${id}`}>
                        <span className="italic text-slate-100">{date}</span> {title}
                    </Link>
                    </h1>
                ))}
            </div>
        </div>
    )

}


export default Experience;

export async function getStaticProps() {
  const allPostsData = getSortedPostsData()
  return {
    props: {
      allPostsData
    }
  }
}