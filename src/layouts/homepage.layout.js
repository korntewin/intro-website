import NavigationBar from '../components/navbar.component';
import SideBarComponent from '../components/sidebar.component';
import BodyComponent from '../components/body.component';
import FooterComponent from '../components/footer.component';

const HomePageLayout = ({ children, navbar_welcomemsg }) => {

    return (
        <div>
            <NavigationBar welcomemsg={navbar_welcomemsg}/>
            <SideBarComponent />
            <BodyComponent > 
                {children}
                <FooterComponent />
            </BodyComponent>
        </div>
    );
}

export default HomePageLayout;