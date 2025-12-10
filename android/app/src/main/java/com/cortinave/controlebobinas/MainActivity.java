package com.cortinave.controlebobinas;

import android.os.Bundle;
import android.webkit.CookieManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // FORÇAR LIMPEZA DE CACHE - Debug WebView cache teimoso
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().clearCache(true);
            getBridge().getWebView().clearHistory();
            CookieManager.getInstance().removeAllCookies(null);
            CookieManager.getInstance().flush();
            
            android.util.Log.d("MainActivity", "🔥 Cache WebView FORÇADAMENTE LIMPO!");
        }
    }
}
