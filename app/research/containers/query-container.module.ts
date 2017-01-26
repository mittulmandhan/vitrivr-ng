import {MaterialModule} from '@angular/material';
import {NgModule}      from '@angular/core';
import {FormsModule} from "@angular/forms";
import {BrowserModule} from '@angular/platform-browser';
import {QueryContainerComponent} from "./query-container.component";
import {ImageQueryTermModule} from "./images/image-query-term.module";
import {AudioQueryTermModule} from "./audio/audio-query-term.module";

@NgModule({
    imports:      [ BrowserModule, FormsModule, MaterialModule.forRoot(), ImageQueryTermModule, AudioQueryTermModule ],
    declarations: [ QueryContainerComponent ],
    exports:      [ QueryContainerComponent ]
})

export class QueryContainerModule { }
