export const openSideBar = {
    type: "openCloseSideBar",
    payload: true,
}

export const closeSideBar = {
    type: "openCloseSideBar",
    payload: false,
}


export const mapStateToProps = state => (
    {isSideBarOpen: state.isSideBarOpen}
);


export const mapDispatchToProps = dispatch => ({
    openSideBar: () => dispatch(openSideBar),
    closeSideBar: () => dispatch(closeSideBar),
})