import Link from "next/link";
import CardList from "@/components/cardlist/cardlist.component";
import NavBar from "@/components/navbar/v2/navbar.component";
import { assetPrefix } from ".";

const SOCIAL_LINKS = [
    { imgSrc: `${assetPrefix}/linkedin.png`, name: "Linkedin", href: "https://www.linkedin.com/in/korntewin/", description: "You can follow my linkedin here", width: 100, height: 100, target: "_blank" },
    { imgSrc: `${assetPrefix}/github.png`, name: "Github", href: "https://github.com/korntewin", description: "And you can follow my Github here", width: 100, height: 100, target: "_blank" },
]
const PCA = <Link target="_blank" href="https://google.accredible.com/34e8fd91-a68a-4325-83e0-fdea8c1e3d44"><span className="underline font-bold">GCP&apos;s Professional Data Architect</span></Link>;
const PDE = <Link target="_blank" href="https://google.accredible.com/0bc42dee-895c-4e69-a924-8640cdfe01fd"><span className="underline font-bold">GCP&apos;s Professional Data Engineer</span></Link>;
const TFD = <Link target="_blank" href="https://www.credential.net/b03843b4-2031-45d3-8c07-3173c738be57"><span className="underline font-bold">Tensorflow Developer</span></Link>;

function About() {


    return (
        <div >
            <NavBar addClass="z-40 sticky top-0" />
            <div
                className="flex flex-col items-center h-full md:h-screen bg-gradient-to-r from-green-400 to-blue-500 brightness-90"
            >
                <p className="mx-20 mt-10 text-justify text-2xl text-white font-semibold drop-shadow">
                    I&apos;m a self-starter with a willingness to learn, exhibited by proven self-taught skills in Engineering & Deep Learning with {PDE}, {PCA}, and {TFD} Certificate. I have also contributed to Tensorflow codebase.
                </p>
                <p className="mx-20 mt-5 text-justify text-2xl text-white font-semibold drop-shadow">
                    I am currently working at Thinking Machines as a Machine Learning Engineer, with experience in developing, building, deploying, and monitoring ML model (scikit-learn/tensorflow) and data processing pipeline (Spark on hadoop ecosystem) in production. I have experience working with data processing systems for big data of multiple TB scale with Spark on both batch/online channel.
                </p>
                <p className="mx-20 mt-5 text-justify text-2xl text-white font-semibold drop-shadow">
                    My background is in Master of Engineering major in Power System which heavily applies various optimization techniques (Linear programming/Quadratic programming/Stochastic optimization) for research field in disruptive technology, especially Battery Energy Storage System (BESS).
                    I am also familiar with financial feasibility studies to evaluate financial profit for Photovoltaic System and BESS project.
                </p>
                <CardList ls={SOCIAL_LINKS} />
            </div>
        </div>
    )

}


export default About;
export { PCA, PDE, TFD };