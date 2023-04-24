import { companies } from "..";
import SideBar from "@/components/sidebar/sidebar.component";
import NavBar from "@/components/navbar/v2/navbar.component";
import { Data, getAllPostIds, getPostData } from "../../lib/utils";

type PostData = {
    postData: Data;
}

type Params = {
    params: Data;
}


export async function getStaticPaths() {
    const paths = getAllPostIds()
    return {
        paths,
        fallback: false
    }
}

export async function getStaticProps({ params }: Params) {
    const postData = await getPostData(params.id)
    return {
        props: {
            postData
        }
    }
}


function Experience({ postData }: PostData) {

    return (
        <div className="bg-gradient-to-r from-green-400 to-blue-500 brightness-95" >
            <NavBar addClass="z-40 sticky top-0" />
            <div className="md:flex flex-row">
                <SideBar ls={companies} />
                <div className="h-screen px-2 py-5">
                    {/* {postData.contentHtml} */}
                    <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
                </div>
            </div>
        </div>
    )

}


export default Experience;