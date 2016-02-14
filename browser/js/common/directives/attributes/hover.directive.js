app.directive('darkenOnHover', function () {
    return {
        restrict: 'A',
        link: function (scope, element, atts) {
            element.on('mouseenter', function () {
                element.addClass('darken-on-hover');
            });
            element.on('mouseleave', function () {
                element.removeClass('darken-on-hover');
            });
        }
    };
});