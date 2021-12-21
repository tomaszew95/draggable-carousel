var draggableCarouselPlugin = document.getElementById("ceros-draggable-carousel-plugin");
(function(){
    'use strict';
    require.config({
        paths: {
            CerosSDK: '//sdk.ceros.com/standalone-player-sdk-v5.min'
        }
    });
    require(['CerosSDK'], function (CerosSDK) {
        CerosSDK.findExperience()
            .fail(function (error) {
                console.error(error);
            })
            .done(function (experience) {
                window.myExperience = experience;
                var allDraggableCarousels = experience.findLayersByTag("draggable").layers;
                
                //GLOBAL CAROUSEL PROPERTIES
                var root = document.querySelector(':root')
                var effectMultiplier = draggableCarouselPlugin.getAttribute("effect-multiplier")
                var animationTime = draggableCarouselPlugin.getAttribute("animation-time")
                
                var tagsNames = ['scale-effect','rotate-y-effect', 'skew-x-effect']
                var classesNames = ['carousel-children-scale', 'carousel-children-rotate-y', 'carousel-children-skew-x']

                experience.on(CerosSDK.EVENTS.PAGE_CHANGED, pageChangedCallbackCaro);
                function pageChangedCallbackCaro(){
                    let pageContainer = document.querySelector(".page-viewport.top > .page-container");
                    //making new array of scrollObjects that are on current page 
                    let draggableCarousels = allDraggableCarousels.filter(($object) =>{
                        let $obj = document.getElementById($object.id);
                        if(pageContainer.contains($obj)){
                            return $object;
                        }
                    })

                    class Carousel{
                        constructor(mainElement, cerosObj, hammerObj, transition, draggableRange){
                            this.mainElement = mainElement;
                            this.cerosObj = cerosObj;
                            this.hammerObj = hammerObj;
                            this.transition = transition;
                            this.draggableRange = draggableRange;
                        }

                        hotspotFunction(hotspotChecker){
                            let hotspotObjects = $(this.mainElement).find('.hotspot').toArray()
                            for(let hotspot of hotspotObjects){
                                hotspot.classList.remove('temporary-disabled')
                                if(hotspotChecker==true && hotspot.style.display != 'none'){
                                    hotspot.classList.add('temporary-disabled')
                                }
                            }

                            //disable videos too
                            var videoClass = document.getElementsByClassName('video')
                            for(let video of videoClass){
                                let v = video.querySelector('video')
                                if(v.autoplay === false){
                                    let vid = experience.findComponentById(video.id)
                                    vid.stopVideo()
                                }
                            }
                        }

                        transitionFunction(e, transitionVal){
                            //screen proportion
                            let viewportWidth = $(pageContainer).parent().width()
                            let windowWidth = window.innerWidth
                            let proportion = windowWidth/viewportWidth

                            //translation effect
                            this.transition.delta = this.transition.value/proportion*this.transition.multiplier + this.transition.previous
                            if((this.transition.delta <= 0) && (this.transition.delta >= this.draggableRange)){
                                this.mainElement.style.transform = `translate3d(${this.transition.delta}px,0px,0px)`
                                this.transition.current = this.transition.delta
                            }
                            else if(this.transition.delta>=0){
                                this.mainElement.style.transform = `translate3d(0px,0px,0px)`
                                this.transition.current = 0
                                // transitionVal = 0
                            }
                            else{
                                this.mainElement.style.transform = `translate3d(${this.draggableRange}px,0px,0px)`
                                this.transition.current = this.draggableRange
                                // transitionVal = this.draggableRange
                            }
                        }
                        startOnPanFunction(){
                            // console.log(this.cerosObj)
                            let transitionValue = 0
                            let newDirection = 1
                            this.hammerObj.on("press panleft panright", (ev) => {
                                newDirection = 1 
                                if(Math.abs(transitionValue) > Math.abs(ev.deltaX)){
                                    newDirection = -1
                                }
                                if(Math.abs(transitionValue) == Math.abs(ev.deltaX)){
                                    newDirection = 0
                                }

                                transitionValue = ev.deltaX
                                this.transition.value = ev.deltaX
                                
                                this.transitionFunction(ev, transitionValue)
                                this.hotspotFunction(true)
                                childrenClassFunction(this.cerosObj, 'scale-effect', "carousel-children-scale", true, 1)
                                childrenClassFunction(this.cerosObj, 'rotate-y-effect', "carousel-children-rotate-y", true, Math.sign(newDirection))
                                childrenClassFunction(this.cerosObj, 'skew-x-effect', "carousel-children-skew-x", true, Math.sign(newDirection))
                            })
                        }
                        endOnPanFunction(){
                            this.hammerObj.on("pressup panend pancancel", (ev) => {
                                this.transition.previous = this.transition.current
                                this.hotspotFunction(false)
                                childrenClassFunction(this.cerosObj, 'scale-effect', "carousel-children-scale", false, 1)
                                childrenClassFunction(this.cerosObj, 'rotate-y-effect', "carousel-children-rotate-y", false, Math.sign(this.transition.value))
                                childrenClassFunction(this.cerosObj, 'skew-x-effect', "carousel-children-skew-x", false, Math.sign(this.transition.value))
                            })
                        }
                    }

                    //FOR EACH CAROUSEL
                    let dragCarousels = []
                    for(let i=0; i<draggableCarousels.length;i++){
                        let draggableCarousel = document.getElementById(draggableCarousels[i].id)

                        //set classes
                        draggableCarousel.classList.add("dragging-carousel")
                        for(let t of tagsNames){
                            childrenClassFunction(draggableCarousels[i], t, "carousel-children-transition", true, 1)
                        }
                        
                        //turn off draggable on img
                        let images = $(draggableCarousel).find('img').toArray()
                        for(let image of images){
                            image.setAttribute('draggable', false)
                        }

                        //set default properties
                        let transitionMultiplier = parseFloat(effectMultiplier)
                        let animTime = parseFloat(animationTime)
                        //use properties from tags
                        let carouselTags = draggableCarousels[i].tags
                        _.forEach(carouselTags, function(value, key){
                            if(value.indexOf("multiplier:") > -1){
                                let multiplier = value.slice(11, value.length)
                                transitionMultiplier = parseFloat(multiplier)
                            }
                            if(value.indexOf("drag-duration:") > -1){
                                let dragDuration = value.slice(14, value.length)
                                animTime = parseFloat(dragDuration)
                            }
                        })
                        draggableCarousel.style.setProperty('transition-duration', `${animTime}ms`, 'important')
                        //transition properties
                        let transitionEffect = {
                            value: 0,
                            previous: 0,
                            delta: 0,
                            current: 0,
                            multiplier: transitionMultiplier
                        }

                        //page margins
                        let pageSrcollObject = pageContainer.querySelector(".page-scroll")
                        let pageScrollWidth = parseFloat(pageSrcollObject.style.width)
                        //finding empty-shape
                        let draggableCarouselChildren = draggableCarousels[i].items
                        let emptyShapes = draggableCarouselChildren.filter((component) =>{
                            for(let empty of component.tags){
                                if(empty=="empty-shape"){
                                    return component
                                }
                            }
                        })
                        let emptyShape = document.getElementById(emptyShapes[0].id)
                        //carousel values
                        const carouselShape = {
                            posX: parseInt(draggableCarousel.style.getPropertyValue('left')),
                            posY: parseInt(draggableCarousel.style.getPropertyValue('top')),
                            width: emptyShape.style.width,
                            height: emptyShape.style.height
                        }
                        let draggableWidth = -(parseInt(carouselShape.width) + carouselShape.posX - pageScrollWidth)

                        //set size of carousel group
                        draggableCarousel.style.width = carouselShape.width
                        draggableCarousel.style.height = carouselShape.height

                        //HAMMER.js
                        let hammerObject = new Hammer(draggableCarousel)
                        hammerObject.get('pan').set({ 
                            pointers: 1,
                            threshold: 1
                        })

                        //new Carousel class
                        dragCarousels[i] = new Carousel(draggableCarousel, draggableCarousels[i], hammerObject, transitionEffect, draggableWidth)
                        dragCarousels[i].startOnPanFunction()
                        dragCarousels[i].endOnPanFunction()
                    }

                    window.addEventListener('resize', () =>{
                        for(let dragCarousel of dragCarousels){
                            dragCarousel.mainElement.classList.remove("dragging-carousel")
                        }
                    })
                }

                var childrenClassFunction = (cerosObject, tagName, className, classChecker, forceDirection) =>{
                    let allComponents = cerosObject.findAllComponents()
                    let draggingEffect = allComponents.findComponentsByTag(tagName).layers
                    root.style.setProperty('--carousel-children-rotate', `${12*forceDirection}deg`)
                    for(let dragEffect of draggingEffect){
                        let drag = document.getElementById(dragEffect.id)
                        if(classChecker){
                            drag.classList.add(className)
                        }
                        else{
                            drag.classList.remove(className)
                        }
                    }
                }
            })
    });
})();